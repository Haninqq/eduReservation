package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.User;
import kr.ac.hanyang.backend.mapper.UserMapper;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserMapper userMapper;
    
    /**
     * 이메일로 사용자 조회
     */
    public User findByEmail(String email) {
        return userMapper.findByEmail(email);
    }
    
    /**
     * ID로 사용자 조회
     */
    public User findById(Long id) {
        return userMapper.findById(id);
    }
    
    /**
     * 사용자 생성 또는 업데이트
     * OAuth2 로그인 시 사용자가 존재하면 업데이트, 없으면 생성
     */
    public User createOrUpdateUser(String email, String fullName, String provider, String providerId) {
        // 이메일 도메인 검증: hanyang.ac.kr만 허용
        if (!email.endsWith("@hanyang.ac.kr")) {
            throw new IllegalArgumentException("한양대학교 이메일(@hanyang.ac.kr)만 사용 가능합니다.");
        }
        
        // 이름 파싱: "한인규 | 교육공학과 | 한양대(서울)" 형식
        String[] nameParts = parseHanyangName(fullName);
        String name = nameParts[0];  // 실제 이름
        String department = nameParts[1];  // 학과/소속
        
        User existingUser = userMapper.findByEmail(email);
        
        if (existingUser != null) {
            // 기존 사용자 업데이트
            existingUser.setName(name);
            existingUser.setDepartment(department);
            userMapper.update(existingUser);
            return existingUser;
        } else {
            // 새 사용자 생성 (기본 role: 0 = 일반 사용자)
            User newUser = User.builder()
                    .email(email)
                    .name(name)
                    .department(department)
                    .provider(provider)
                    .providerId(providerId)
                    .role(0)  // 기본값: 일반 사용자
                    .build();
            userMapper.insert(newUser);
            return newUser;
        }
    }
    
    /**
     * 한양대 이름 형식 파싱
     * 입력: "한인규 | 교육공학과 | 한양대(서울)"
     * 출력: ["한인규", "교육공학과"]
     */
    private String[] parseHanyangName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return new String[]{"Unknown", "Unknown"};
        }
        
        String[] parts = fullName.split("\\|");
        
        String name = parts.length > 0 ? parts[0].trim() : "Unknown";
        String department = parts.length > 1 ? parts[1].trim() : "Unknown";
        
        return new String[]{name, department};
    }

    /**
     * 모든 사용자 조회 (슈퍼관리자용)
     */
    public List<User> getAllUsers() {
        return userMapper.findAll();
    }

    /**
     * 사용자 role 업데이트 (슈퍼관리자용)
     */
    public void updateUserRole(Long userId, Integer newRole) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new IllegalArgumentException("사용자를 찾을 수 없습니다.");
        }
        
        userMapper.updateRole(userId, newRole);
    }
}

