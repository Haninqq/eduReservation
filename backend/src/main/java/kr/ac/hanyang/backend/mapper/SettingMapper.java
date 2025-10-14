package kr.ac.hanyang.backend.mapper;

import kr.ac.hanyang.backend.dto.Setting;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface SettingMapper {
    List<Setting> findAll();
}
