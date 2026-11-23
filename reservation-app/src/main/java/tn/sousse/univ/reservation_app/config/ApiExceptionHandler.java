package tn.sousse.univ.reservation_app.config;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Turns "optional feature disabled" errors into a clear 503 instead of a 500 stack trace. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(GoogleCalendarUnavailableException.class)
    public ResponseEntity<Map<String, String>> calendarUnavailable(GoogleCalendarUnavailableException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", e.getMessage()));
    }
}
