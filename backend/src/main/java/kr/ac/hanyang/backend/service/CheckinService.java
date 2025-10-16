package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.Reservation;
import kr.ac.hanyang.backend.dto.User;
import kr.ac.hanyang.backend.mapper.ReservationMapper;
import kr.ac.hanyang.backend.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CheckinService {

    private final ReservationMapper reservationMapper;
    private final UserMapper userMapper;

    /**
     * QR 코드 스캔 후 체크인
     * 
     * @param email 사용자 이메일
     * @param roomId 방 ID
     * @return 체크인된 예약
     */
    @Transactional
    public Reservation checkin(String email, Integer roomId) {
        // 1. 사용자 조회
        User user = userMapper.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }

        // 2. 오늘 날짜의 해당 방 예약 찾기
        LocalDate today = LocalDate.now();
        List<Reservation> myReservations = reservationMapper.findByUserId(user.getId().intValue());
        
        Reservation targetReservation = myReservations.stream()
                .filter(r -> r.getRoomId() == roomId)
                .filter(r -> r.getDate().equals(today))
                .filter(r -> "RESERVED".equals(r.getStatus()))
                .filter(r -> r.getCheckinTime() == null) // 아직 체크인 안 한 예약
                .findFirst()
                .orElse(null);

        if (targetReservation == null) {
            throw new IllegalArgumentException("오늘 이 방에 대한 예약이 없거나 이미 체크인했습니다.");
        }

        // 3. 예약 시간 확인 (시작 15분 전부터 체크인 가능)
        int currentSlot = getCurrentSlot();
        int reservationStartSlot = targetReservation.getStartSlot();
        
        // 15분 전 = 1슬롯 전 (30분 단위)
        if (currentSlot < reservationStartSlot - 1) {
            throw new IllegalArgumentException("예약 시작 15분 전부터 체크인 가능합니다.");
        }

        // 예약 종료 후에는 체크인 불가
        int reservationEndSlot = targetReservation.getEndSlot();
        if (currentSlot > reservationEndSlot) {
            throw new IllegalArgumentException("예약 시간이 이미 종료되었습니다.");
        }

        // 4. 15분 경과 확인 (예약 시작 후 15분 = 예약 시작 시간 + 15분)
        LocalTime reservationStartTime = slotToTime(reservationStartSlot);
        LocalDateTime reservationStartDateTime = LocalDateTime.of(today, reservationStartTime);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = reservationStartDateTime.plusMinutes(15);

        if (now.isAfter(deadline)) {
            // 15분 초과 → 예약 자동 취소
            reservationMapper.deleteById(targetReservation.getId());
            log.info("예약 ID {}는 15분 내 체크인하지 않아 자동 취소되었습니다.", targetReservation.getId());
            throw new IllegalArgumentException("예약 시작 후 15분이 경과하여 예약이 자동 취소되었습니다.");
        }

        // 5. 체크인 처리
        reservationMapper.updateCheckinTime(targetReservation.getId());
        log.info("체크인 완료: reservationId={}, userId={}, roomId={}", 
                targetReservation.getId(), user.getId(), roomId);

        // 업데이트된 예약 정보 반환
        return reservationMapper.findById(targetReservation.getId());
    }

    /**
     * 예약 ID로 체크인 (수동 체크인)
     */
    @Transactional
    public Reservation checkinByReservationId(Integer reservationId) {
        Reservation reservation = reservationMapper.findById(reservationId);
        
        if (reservation == null) {
            throw new IllegalArgumentException("예약을 찾을 수 없습니다.");
        }

        if (!"RESERVED".equals(reservation.getStatus())) {
            throw new IllegalArgumentException("예약 상태가 유효하지 않습니다.");
        }

        if (reservation.getCheckinTime() != null) {
            throw new IllegalArgumentException("이미 체크인된 예약입니다.");
        }

        // 체크인 처리
        reservationMapper.updateCheckinTime(reservationId);
        log.info("수동 체크인 완료: reservationId={}", reservationId);

        return reservationMapper.findById(reservationId);
    }

    /**
     * 현재 시간을 슬롯 인덱스로 변환
     */
    private int getCurrentSlot() {
        LocalTime now = LocalTime.now();
        int hour = now.getHour();
        int minute = now.getMinute();
        return hour * 2 + (minute >= 30 ? 1 : 0);
    }

    /**
     * 슬롯 인덱스를 시간으로 변환
     */
    private LocalTime slotToTime(int slot) {
        int hour = slot / 2;
        int minute = (slot % 2) * 30;
        return LocalTime.of(hour, minute);
    }
}

