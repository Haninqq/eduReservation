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

    /**
     * 모든 예약 조회 (관리자용)
     */
    List<Reservation> findAll();

    /**
     * 현재 진행 중인 예약 조회 (관리자용)
     */
    List<Reservation> getCurrentReservations();

    /**
     * 체크인 시간 업데이트
     */
    void updateCheckinTime(@Param("id") int id);
}
