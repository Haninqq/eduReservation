package kr.ac.hanyang.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class Reservation {
    private int id;
    private int userId;
    private int roomId;
    private LocalDate date;
    private int startSlot;
    private int endSlot;
    private String status;
    private LocalDateTime checkinTime;
    private Boolean checkinRequired;  // 체크인 필요 여부
    private LocalDateTime createdAt;
}
