package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.Reservation;
import kr.ac.hanyang.backend.dto.ReservationRequestDTO;
import kr.ac.hanyang.backend.exception.ReservationException;
import kr.ac.hanyang.backend.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@RequiredArgsConstructor
@Service
@Log4j2
public class ReservationService {
    private final ReservationMapper reservationMapper;
    private final SettingService settingService;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Reservation createReservation(ReservationRequestDTO request) {

        // --- 설정값 가져오기 ---
        int dailyLimitHours = settingService.getIntValue("DAILY_LIMIT_HOURS", 3); // 기본값 3시간
        int maxSlotsPerDay = dailyLimitHours * 2; // 30분 단위 슬롯이므로 시간 * 2
        int openingHour = settingService.getIntValue("OPENING_HOUR", 9); // 기본값 09:00
        int closingHour = settingService.getIntValue("CLOSING_HOUR", 21); // 기본값 21:00
        
        // --- 정책 검증 로직 ---
        // 0. 예약 가능한 날짜 범위 검증 (오늘 ~ 6일 뒤)
        LocalDate today = LocalDate.now();
        LocalDate maxReservationDate = today.plusDays(6);
        if (request.getDate().isAfter(maxReservationDate)) {
            throw new ReservationException("예약은 최대 " + maxReservationDate + "까지만 가능합니다.");
        }

        // 1. 운영 시간 검증 (OPENING_HOUR ~ CLOSING_HOUR)
        int requestStartHour = request.getStartSlot() / 2;
        int requestEndHour = (request.getEndSlot() + 1) / 2; // 종료 슬롯의 다음 시간
        
        if (requestStartHour < openingHour || requestEndHour > closingHour) {
            throw new ReservationException(String.format("예약 가능 시간은 %02d:00 ~ %02d:00 입니다.", openingHour, closingHour));
        }

        // 2. 하루에 예약 가능한 총 시간 검증 (DAILY_LIMIT_HOURS 사용)
        int requestedSlots = request.getEndSlot() - request.getStartSlot() + 1;
        Integer alreadyReservedSlots = reservationMapper.getTotalReservedSlotsByUserIdAndDate(request.getUserId(), request.getDate());
        if (alreadyReservedSlots + requestedSlots > maxSlotsPerDay) {
            throw new ReservationException("하루에 최대 " + dailyLimitHours + "시간까지 예약할 수 있습니다. (현재 " + (alreadyReservedSlots/2.0) + "시간 예약됨)");
        }
        
        // --- 동시성 제어 로직 ---
        for (int slot = request.getStartSlot(); slot <= request.getEndSlot(); slot++) {
            if (reservationMapper.isSlotBookedForUpdate(request.getRoomId(), request.getDate(), slot) != null) {
                throw new ReservationException("선택하신 시간 [" + formatSlot(slot) + "]는 이미 다른 사용자가 예약했습니다.");
            }
        }

        // 2. 모든 슬롯이 예약 가능하므로, 이제 실제 예약을 진행
        Reservation reservation = new Reservation();
        reservation.setUserId(request.getUserId());
        reservation.setRoomId(request.getRoomId());
        reservation.setDate(request.getDate());
        reservation.setStartSlot(request.getStartSlot());
        reservation.setEndSlot(request.getEndSlot());
        reservation.setStatus("RESERVED"); // 상태는 'RESERVED'

        reservationMapper.insertReservation(reservation);

        log.info("Reservation created successfully: {}", reservation.getId());

        return reservation;
    }

    @Transactional(readOnly = true)
    public List<Reservation> getReservationsByDate(LocalDate date) {
        return reservationMapper.getReservationsByDate(date);
    }

    @Transactional(readOnly = true)
    public List<Reservation> getReservationsByUserId(int userId) {
        return reservationMapper.findByUserId(userId);
    }

    @Transactional
    public void cancelReservation(int reservationId, int userId) {
        Reservation reservation = reservationMapper.findById(reservationId);
        if (reservation == null) {
            throw new ReservationException("Reservation not found with id: " + reservationId);
        }
        // TODO: 추후 관리자 권한 체크 로직 추가
        if (reservation.getUserId() != userId) {
            throw new ReservationException("You are not authorized to cancel this reservation.");
        }
        if (!"RESERVED".equals(reservation.getStatus())) {
            throw new ReservationException("This reservation cannot be cancelled as it is not in 'RESERVED' status.");
        }

        reservationMapper.deleteById(reservationId);
        log.info("Reservation with id {} has been deleted by user {}.", reservationId, userId);
    }

    private String formatSlot(int slot) {
        int hour = slot / 2;
        String minute = (slot % 2 == 0) ? "00" : "30";
        return String.format("%02d:%s", hour, minute);
    }

    /**
     * 현재 진행 중인 예약 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<Reservation> getCurrentReservations() {
        return reservationMapper.getCurrentReservations();
    }

    /**
     * 모든 예약 조회 (관리자용)
     */
    @Transactional(readOnly = true)
    public List<Reservation> getAllReservations() {
        return reservationMapper.findAll();
    }

    /**
     * 관리자 권한으로 예약 취소
     */
    @Transactional
    public void cancelReservationByAdmin(Long reservationId) {
        Reservation reservation = reservationMapper.findById(reservationId.intValue());
        if (reservation == null) {
            throw new ReservationException("예약을 찾을 수 없습니다: " + reservationId);
        }
        if (!"RESERVED".equals(reservation.getStatus())) {
            throw new ReservationException("이미 취소되었거나 완료된 예약입니다.");
        }

        reservationMapper.deleteById(reservationId.intValue());
        log.info("관리자가 예약 ID {}를 취소했습니다.", reservationId);
    }
}
