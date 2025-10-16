package kr.ac.hanyang.backend.mapper;

import kr.ac.hanyang.backend.dto.Setting;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SettingMapper {
    
    List<Setting> findAll();
    
    void update(@Param("keyName") String keyName, @Param("value") String value);
    
    Setting findByKey(String keyName);
}
