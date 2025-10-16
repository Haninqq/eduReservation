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
     * 매분마다 체크인하지 않은 예약을 확인하여 마감 시간 초과 시 자동 취소
     * 체크인 마감 시간 = 슬롯 종료 - 15분
     */
    @Scheduled(fixedRate = 60000) // 1분마다 실행
    public void cancelNoShowReservations() {
        try {
            LocalDate today = LocalDate.now();
            LocalDateTime now = LocalDateTime.now();

            // 오늘 날짜의 모든 예약 조회
            List<Reservation> todayReservations = reservationMapper.getReservationsByDate(today);

            for (Reservation reservation : todayReservations) {
                // 체크인 필요하고, 체크인하지 않은 예약만 처리
                if ("RESERVED".equals(reservation.getStatus()) 
                    && Boolean.TRUE.equals(reservation.getCheckinRequired())
                    && reservation.getCheckinTime() == null) {
                    
                    // 체크인 마감 시간 = 슬롯 종료 - 15분
                    // 슬롯 종료 시간 = 슬롯 시작 시간 + 30분
                    LocalTime endTime = slotToTime(reservation.getEndSlot()).plusMinutes(30);
                    LocalDateTime checkinDeadline = LocalDateTime.of(today, endTime).minusMinutes(15);

                    // 현재 시간이 체크인 마감 시간을 초과했는지 확인
                    if (now.isAfter(checkinDeadline)) {
                        // 자동 취소
                        reservationMapper.deleteById(reservation.getId());
                        log.info("노쇼 예약 자동 취소: reservationId={}, userId={}, roomId={}, checkinDeadline={}", 
                                reservation.getId(), reservation.getUserId(), reservation.getRoomId(), checkinDeadline);
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

