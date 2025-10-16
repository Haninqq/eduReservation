package kr.ac.hanyang.backend.mapper;

import kr.ac.hanyang.backend.dto.User;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserMapper {
    
    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(Long id);
    
    @Select("SELECT * FROM users WHERE email = #{email}")
    User findByEmail(String email);
    
    @Insert("INSERT INTO users (email, name, department, provider, provider_id, role, created_at, updated_at) " +
            "VALUES (#{email}, #{name}, #{department}, #{provider}, #{providerId}, COALESCE(#{role}, 0), NOW(), NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(User user);
    
    @Update("UPDATE users SET name = #{name}, department = #{department}, updated_at = NOW() WHERE id = #{id}")
    void update(User user);
    
    @Select("SELECT * FROM users ORDER BY created_at DESC")
    List<User> findAll();
    
    @Update("UPDATE users SET role = #{role}, updated_at = NOW() WHERE id = #{userId}")
    void updateRole(@Param("userId") Long userId, @Param("role") Integer role);
}

