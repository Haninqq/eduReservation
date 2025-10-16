package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.dto.Setting;
import kr.ac.hanyang.backend.service.SettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class SettingController {

    private final SettingService settingService;

    /**
     * 공개 설정 조회 (로그인 불필요)
     * 프론트엔드에서 예약 UI를 구성하는 데 필요한 설정값
     */
    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> getPublicSettings() {
        log.info("공개 설정 조회 요청");
        
        Map<String, String> publicSettings = new HashMap<>();
        publicSettings.put("OPENING_HOUR", settingService.getValue("OPENING_HOUR", "9"));
        publicSettings.put("CLOSING_HOUR", settingService.getValue("CLOSING_HOUR", "21"));
        publicSettings.put("DAILY_LIMIT_HOURS", settingService.getValue("DAILY_LIMIT_HOURS", "3"));
        publicSettings.put("MAX_SLOTS_PER_RESERVATION", settingService.getValue("MAX_SLOTS_PER_RESERVATION", "6"));
        
        return ResponseEntity.ok(publicSettings);
    }
}

