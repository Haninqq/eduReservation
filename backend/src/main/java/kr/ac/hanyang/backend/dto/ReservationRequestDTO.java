package kr.ac.hanyang.backend.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class ReservationRequestDTO {
    private int userId;
    private int roomId;
    private LocalDate date;
    private int startSlot;
    private int endSlot;
}
