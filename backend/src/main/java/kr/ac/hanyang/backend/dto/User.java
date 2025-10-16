package kr.ac.hanyang.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String email;
    private String name;  // 실제 이름만 (예: "한인규")
    private String department;  // 소속/학과 (예: "교육공학과")
    private Integer role;  // 0: user, 1: admin, 2: SuperAdmin
    private String provider;  // "google"
    private String providerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

