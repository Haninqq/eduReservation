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
import java.time.ZoneId;
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

        // 2. 오늘 날짜의 해당 방 예약 찾기 (현재 시간대 우선 매칭)
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        List<Reservation> myReservations = reservationMapper.findByUserId(user.getId().intValue());
        int nowSlot = getCurrentSlot();

        // 이미 체크인된 예약이 있는 경우 재스캔 시에도 성공으로 응답 (현재 시간대에 해당하는 것만)
        Reservation alreadyCheckedIn = myReservations.stream()
                .filter(r -> r.getRoomId() == roomId)
                .filter(r -> r.getDate().equals(today))
                .filter(r -> "CHECKED_IN".equals(r.getStatus()))
                .filter(r -> nowSlot >= r.getStartSlot() && nowSlot < (r.getEndSlot() + 1)) // 현재 시간대에 해당
                .findFirst()
                .orElse(null);
        if (alreadyCheckedIn != null) {
            log.info("이미 체크인된 예약 재스캔 처리: reservationId={}, userId={}, roomId={}",
                    alreadyCheckedIn.getId(), user.getId(), roomId);
            return alreadyCheckedIn;
        }

        List<Reservation> candidates = myReservations.stream()
                .filter(r -> r.getRoomId() == roomId)
                .filter(r -> r.getDate().equals(today))
                .filter(r -> "RESERVED".equals(r.getStatus()))
                .filter(r -> r.getCheckinTime() == null) // 아직 체크인 안 한 예약
                .sorted((a, b) -> Integer.compare(a.getStartSlot(), b.getStartSlot()))
                .toList();

        // 현재 시간대에 해당하는 예약을 우선 선택 (endSlot은 포함이므로 endSlot+1의 시작 전까지 유효)
        Reservation targetReservation = candidates.stream()
                .filter(r -> nowSlot >= r.getStartSlot() && nowSlot < (r.getEndSlot() + 1))
                .findFirst()
                .orElse(null);

        // 현재 시간대 예약이 없다면, 아직 시작 전인 가장 이른 예약을 안내용으로 선택
        if (targetReservation == null) {
            targetReservation = candidates.stream()
                    .filter(r -> nowSlot < r.getStartSlot())
                    .findFirst()
                    .orElse(null);
        }

        if (targetReservation == null) {
            throw new IllegalArgumentException("오늘 이 방에 대한 예약이 없거나 이미 체크인했습니다.");
        }

        // 3. 체크인 필요 여부: 불필요 예약이면 상태 변경 없이 안내만 하도록 그대로 반환
        if (Boolean.FALSE.equals(targetReservation.getCheckinRequired())) {
            log.info("체크인 불필요 예약: reservationId={}, userId={}, roomId={}",
                    targetReservation.getId(), user.getId(), roomId);
            return reservationMapper.findById(targetReservation.getId());
        }

        // 4. 예약 시간 확인 (예약 시작 시간부터 체크인 가능)
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Seoul"));
        LocalTime reservationStartTime = slotToTime(targetReservation.getStartSlot());
        LocalDateTime reservationStartDateTime = LocalDateTime.of(today, reservationStartTime);
        
        // 예약 시작 전에는 체크인 불가
        if (now.isBefore(reservationStartDateTime)) {
            throw new IllegalArgumentException("예약 시작 시간(" + reservationStartTime + " KST)부터 체크인 가능합니다.");
        }

        // 5. 체크인 마감 시간 확인 (정책: 시작 후 15분)
        LocalTime reservationStartTimeForDeadline = slotToTime(targetReservation.getStartSlot());
        LocalDateTime checkinDeadline = LocalDateTime.of(today, reservationStartTimeForDeadline).plusMinutes(15);

        if (now.isAfter(checkinDeadline)) {
            // 체크인 마감 시간 초과 → 이력 보존을 위해 상태만 변경
            reservationMapper.updateStatus(targetReservation.getId(), "CANCELLED");
            log.info("예약 ID {}는 체크인 마감 시간({} KST)까지 체크인하지 않아 자동 취소되었습니다(상태 변경).", 
                    targetReservation.getId(), checkinDeadline);
            throw new IllegalArgumentException("체크인 마감 시간(" + checkinDeadline.toLocalTime() + " KST) 지나 예약이 자동 취소되었습니다.");
        }

        // 6. 체크인 처리
        log.info("체크인 처리 시작: reservationId={}, 현재 상태={}", 
                targetReservation.getId(), targetReservation.getStatus());
        
        reservationMapper.updateCheckinTime(targetReservation.getId());
        reservationMapper.updateStatus(targetReservation.getId(), "CHECKED_IN");
        
        log.info("체크인 완료: reservationId={}, userId={}, roomId={}", 
                targetReservation.getId(), user.getId(), roomId);

        // 업데이트된 예약 정보 반환
        Reservation updatedReservation = reservationMapper.findById(targetReservation.getId());
        log.info("체크인 후 조회 결과: reservationId={}, status={}, checkinTime={}", 
                updatedReservation.getId(), updatedReservation.getStatus(), updatedReservation.getCheckinTime());
        
        return updatedReservation;
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

