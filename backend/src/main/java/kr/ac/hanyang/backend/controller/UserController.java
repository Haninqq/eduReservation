package kr.ac.hanyang.backend.controller;

import kr.ac.hanyang.backend.dto.User;
import kr.ac.hanyang.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class UserController {

    private final UserService userService;

    /**
     * 모든 사용자 조회 (슈퍼관리자용)
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("모든 사용자 조회 요청");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    /**
     * 사용자 role 변경 (슈퍼관리자용)
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<Map<String, String>> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, Integer> request) {
        
        Integer newRole = request.get("role");
        log.info("사용자 role 변경 요청: userId={}, newRole={}", userId, newRole);

        if (newRole == null || newRole < 0 || newRole > 2) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "role은 0(일반), 1(관리자), 2(슈퍼관리자) 중 하나여야 합니다.");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            userService.updateUserRole(userId, newRole);
            
            Map<String, String> response = new HashMap<>();
            String roleName = newRole == 0 ? "일반 사용자" : (newRole == 1 ? "관리자" : "슈퍼 관리자");
            response.put("message", "사용자 권한이 " + roleName + "로 변경되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("사용자 role 변경 실패", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * 사용자 정보 조회
     */
    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        log.info("사용자 정보 조회: userId={}", userId);
        User user = userService.findById(userId);
        
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(user);
    }
}

