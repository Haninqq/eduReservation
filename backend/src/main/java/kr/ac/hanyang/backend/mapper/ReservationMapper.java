package kr.ac.hanyang.backend.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import kr.ac.hanyang.backend.dto.Reservation;
import java.time.LocalDate;
import java.util.List;

@Mapper
public interface ReservationMapper {

    Integer isSlotBookedForUpdate(@Param("roomId") int roomId, @Param("date") LocalDate date, @Param("slot") int slot);

    void insertReservation(Reservation reservation);

    List<Reservation> getReservationsByDate(@Param("date") LocalDate date);

    Integer getTotalReservedSlotsByUserIdAndDate(@Param("userId") int userId, @Param("date") LocalDate date);

    List<Reservation> findByUserId(@Param("userId") int userId);

    Reservation findById(@Param("id") int id);

    void deleteById(@Param("id") int id);
}
