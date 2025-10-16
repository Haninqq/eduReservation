package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.dto.Reservation;
import kr.ac.hanyang.backend.service.CheckinService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class CheckinController {

    private final CheckinService checkinService;

    /**
     * QR 코드 스캔 후 체크인
     * GET /api/checkin?roomId=101
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> checkin(
            @RequestParam Integer roomId,
            Principal principal
    ) {
        log.info("체크인 요청: roomId={}, user={}", roomId, principal != null ? principal.getName() : "anonymous");

        Map<String, Object> response = new HashMap<>();

        try {
            if (principal == null) {
                response.put("success", false);
                response.put("message", "로그인이 필요합니다.");
                return ResponseEntity.status(401).body(response);
            }

            // principal.getName()은 OAuth2에서 email을 반환
            String email = principal.getName();
            
            Reservation checkedInReservation = checkinService.checkin(email, roomId);
            
            response.put("success", true);
            response.put("message", "체크인 완료!");
            response.put("reservation", checkedInReservation);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("체크인 실패: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            log.error("체크인 중 오류 발생", e);
            response.put("success", false);
            response.put("message", "체크인 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * 예약 목록에서 체크인 (userId 기반)
     * POST /api/checkin/manual
     */
    @PostMapping("/manual")
    public ResponseEntity<Map<String, Object>> manualCheckin(
            @RequestBody Map<String, Integer> payload
    ) {
        Integer reservationId = payload.get("reservationId");
        log.info("수동 체크인 요청: reservationId={}", reservationId);

        Map<String, Object> response = new HashMap<>();

        try {
            Reservation checkedInReservation = checkinService.checkinByReservationId(reservationId);
            
            response.put("success", true);
            response.put("message", "체크인 완료!");
            response.put("reservation", checkedInReservation);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("수동 체크인 실패: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
            
        } catch (Exception e) {
            log.error("수동 체크인 중 오류 발생", e);
            response.put("success", false);
            response.put("message", "체크인 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(500).body(response);
        }
    }
}

