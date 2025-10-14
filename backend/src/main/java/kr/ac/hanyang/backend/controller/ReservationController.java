package kr.ac.hanyang.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import kr.ac.hanyang.backend.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import kr.ac.hanyang.backend.dto.Reservation;
import kr.ac.hanyang.backend.dto.ReservationRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@Log4j2
@RequiredArgsConstructor
@RequestMapping("/api/reservation")
public class ReservationController {
    
    private final ReservationService reservationService;

    @PostMapping
    public ResponseEntity<Reservation> createReservation(@RequestBody ReservationRequestDTO request) {
        Reservation reservation = reservationService.createReservation(request);
        return ResponseEntity.ok(reservation);
    }

    @GetMapping
    public ResponseEntity<List<Reservation>> getReservationsByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Reservation> reservations = reservationService.getReservationsByDate(date);
        return ResponseEntity.ok(reservations);
    }

    // TODO: 추후 Spring Security 적용 시, @AuthenticationPrincipal 사용하여 토큰에서 userId 추출하도록 변경
    @GetMapping("/my-reservations")
    public ResponseEntity<List<Reservation>> getMyReservations(@RequestParam("userId") int userId) {
        List<Reservation> reservations = reservationService.getReservationsByUserId(userId);
        return ResponseEntity.ok(reservations);
    }

    // TODO: 추후 Spring Security 적용 시, 토큰에서 userId를 추출하여 권한 검증
    @DeleteMapping("/{reservationId}")
    public ResponseEntity<Void> cancelReservation(
            @PathVariable("reservationId") int reservationId,
            @RequestParam("userId") int userId) {
        reservationService.cancelReservation(reservationId, userId);
        return ResponseEntity.ok().build();
    }
}
