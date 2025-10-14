package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.service.SettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final SettingService settingService;

    @PostMapping("/settings/refresh")
    public ResponseEntity<String> refreshSettings() {
        settingService.refreshCache();
        return ResponseEntity.ok("Settings cache refreshed successfully.");
    }
}
