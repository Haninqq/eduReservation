package kr.ac.hanyang.backend.scheduler;

import kr.ac.hanyang.backend.dto.Reservation;
import kr.ac.hanyang.backend.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationScheduler {

    private final ReservationMapper reservationMapper;

    /**
     * 매분마다 체크인하지 않은 예약을 확인하여 15분 초과 시 자동 취소
     */
    @Scheduled(fixedRate = 60000) // 1분마다 실행
    public void cancelNoShowReservations() {
        try {
            LocalDate today = LocalDate.now();
            LocalDateTime now = LocalDateTime.now();

            // 오늘 날짜의 모든 예약 조회
            List<Reservation> todayReservations = reservationMapper.getReservationsByDate(today);

            for (Reservation reservation : todayReservations) {
                // 체크인하지 않은 예약만 처리
                if ("RESERVED".equals(reservation.getStatus()) && reservation.getCheckinTime() == null) {
                    // 예약 시작 시간
                    LocalTime startTime = slotToTime(reservation.getStartSlot());
                    LocalDateTime reservationStartTime = LocalDateTime.of(today, startTime);
                    LocalDateTime deadline = reservationStartTime.plusMinutes(15);

                    // 현재 시간이 예약 시작 + 15분을 초과했는지 확인
                    if (now.isAfter(deadline)) {
                        // 자동 취소
                        reservationMapper.deleteById(reservation.getId());
                        log.info("노쇼 예약 자동 취소: reservationId={}, userId={}, roomId={}, startTime={}", 
                                reservation.getId(), reservation.getUserId(), reservation.getRoomId(), reservationStartTime);
                    }
                }
            }
        } catch (Exception e) {
            log.error("예약 자동 취소 스케줄러 실행 중 오류 발생", e);
        }
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

