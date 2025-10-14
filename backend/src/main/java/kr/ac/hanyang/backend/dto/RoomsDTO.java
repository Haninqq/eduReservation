package kr.ac.hanyang.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RoomsDTO {
    private int id;
    private String name;
    private String type;
}