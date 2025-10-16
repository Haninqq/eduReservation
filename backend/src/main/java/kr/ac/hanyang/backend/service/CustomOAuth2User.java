package kr.ac.hanyang.backend.service;

import kr.ac.hanyang.backend.dto.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

public class CustomOAuth2User implements OAuth2User {
    
    private final OAuth2User delegate;
    private final Map<String, Object> attributes;
    private final User user;
    
    public CustomOAuth2User(OAuth2User delegate, Map<String, Object> attributes, User user) {
        this.delegate = delegate;
        this.attributes = attributes;
        this.user = user;
    }
    
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return delegate.getAuthorities();
    }
    
    @Override
    public String getName() {
        return user.getEmail();
    }
    
    public User getUser() {
        return user;
    }
    
    public Long getUserId() {
        return user.getId();
    }
}

