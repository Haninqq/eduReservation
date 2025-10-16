package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.dto.Reservation;
import kr.ac.hanyang.backend.dto.Setting;
import kr.ac.hanyang.backend.service.ReservationService;
import kr.ac.hanyang.backend.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AdminController {

    private final SettingService settingService;
    private final ReservationService reservationService;

    /**
     * 모든 설정 조회 (관리자 이상)
     */
    @GetMapping("/settings")
    public ResponseEntity<List<Setting>> getAllSettings() {
        log.info("관리자 설정 조회 요청");
        List<Setting> settings = settingService.getAllSettings();
        return ResponseEntity.ok(settings);
    }

    /**
     * 설정 업데이트 (관리자 이상)
     */
    @PutMapping("/settings")
    public ResponseEntity<Map<String, String>> updateSettings(@RequestBody Map<String, String> settingsMap) {
        log.info("설정 업데이트 요청: {}", settingsMap);
        
        try {
            for (Map.Entry<String, String> entry : settingsMap.entrySet()) {
                settingService.updateSetting(entry.getKey(), entry.getValue());
            }
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "설정이 성공적으로 업데이트되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("설정 업데이트 실패", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 설정 캐시 새로고침 (관리자 이상)
     */
    @PostMapping("/settings/refresh")
    public ResponseEntity<String> refreshSettings() {
        settingService.refreshCache();
        return ResponseEntity.ok("Settings cache refreshed successfully.");
    }

    /**
     * 현재 방 사용 현황 조회 (관리자 이상)
     */
    @GetMapping("/reservations/current")
    public ResponseEntity<List<Reservation>> getCurrentReservations() {
        log.info("현재 방 사용 현황 조회 요청");
        List<Reservation> currentReservations = reservationService.getCurrentReservations();
        return ResponseEntity.ok(currentReservations);
    }

    /**
     * 모든 예약 조회 (관리자 이상)
     */
    @GetMapping("/reservations/all")
    public ResponseEntity<List<Reservation>> getAllReservations() {
        log.info("모든 예약 조회 요청");
        List<Reservation> allReservations = reservationService.getAllReservations();
        return ResponseEntity.ok(allReservations);
    }

    /**
     * 관리자 권한으로 예약 취소 (관리자 이상)
     */
    @DeleteMapping("/reservations/{reservationId}")
    public ResponseEntity<Map<String, String>> cancelReservationByAdmin(@PathVariable Long reservationId) {
        log.info("관리자 예약 취소 요청: reservationId={}", reservationId);
        
        try {
            reservationService.cancelReservationByAdmin(reservationId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "예약이 취소되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("예약 취소 실패", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
