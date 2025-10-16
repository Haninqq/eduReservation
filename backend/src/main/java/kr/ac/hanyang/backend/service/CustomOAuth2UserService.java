package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    private final UserService userService;
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");
        
        log.info("OAuth2 로그인 시도 - Provider: {}, Email: {}, Name: {}", registrationId, email, name);
        
        // 이메일 도메인 검증
        if (email == null || !email.endsWith("@hanyang.ac.kr")) {
            log.warn("한양대학교 이메일이 아님: {}", email);
            throw new OAuth2AuthenticationException(
                new OAuth2Error("invalid_email"),
                "한양대학교 이메일(@hanyang.ac.kr)만 사용 가능합니다."
            );
        }
        
        try {
            // 사용자 생성 또는 업데이트
            User user = userService.createOrUpdateUser(email, name, registrationId, providerId);
            log.info("사용자 로그인 성공 - ID: {}, Email: {}", user.getId(), user.getEmail());
            
            // OAuth2User 속성에 사용자 ID 추가
            Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());
            attributes.put("userId", user.getId());
            
            return new CustomOAuth2User(oAuth2User, attributes, user);
        } catch (IllegalArgumentException e) {
            log.error("사용자 생성/업데이트 실패: {}", e.getMessage());
            throw new OAuth2AuthenticationException(
                new OAuth2Error("user_creation_failed"),
                e.getMessage()
            );
        }
    }
}

