package kr.ac.hanyang.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// @ResponseStatus(HttpStatus.CONFLICT) // Now handled by GlobalExceptionHandler
public class ReservationException extends RuntimeException {
    public ReservationException(String message) {
        super(message);
    }
}
