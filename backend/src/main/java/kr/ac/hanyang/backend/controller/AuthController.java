package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.dto.User;
import kr.ac.hanyang.backend.service.CustomOAuth2User;
import kr.ac.hanyang.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {
    
    private final UserService userService;
    
    /**
     * 현재 로그인한 사용자 정보 조회
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
        }
        
        try {
            String email = principal.getAttribute("email");
            User user = userService.findByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(404).body(Map.of("error", "사용자를 찾을 수 없습니다."));
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("name", user.getName());
            response.put("role", user.getRole() != null ? user.getRole() : 0);  // role 추가
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("사용자 정보 조회 실패", e);
            return ResponseEntity.status(500).body(Map.of("error", "서버 오류가 발생했습니다."));
        }
    }
    
    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "로그아웃 성공"));
    }
}

