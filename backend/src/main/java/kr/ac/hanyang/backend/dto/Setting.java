package kr.ac.hanyang.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class Setting {
    private long id;
    private String keyName;
    private String value;
    private String description;
    private LocalDateTime updatedAt;
}
