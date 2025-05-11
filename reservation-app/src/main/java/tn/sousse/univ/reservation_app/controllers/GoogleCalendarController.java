package tn.sousse.univ.reservation_app.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Pattern;
import tn.sousse.univ.reservation_app.dto.CalendarSlotDTO;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.services.GoogleCalendarService;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:4200")
public class GoogleCalendarController {

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @GetMapping("/reservations/dates")
    public ResponseEntity<List<String>> getReservedDates() {
        try {
            return ResponseEntity.ok(googleCalendarService.getReservedDates());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reservations/pending")
    public ResponseEntity<List<Reservation>> getPendingReservations() {
        return ResponseEntity.ok(googleCalendarService.getPendingReservations());
    }

    @GetMapping("/reservations/confirmed")
    public ResponseEntity<List<Reservation>> getConfirmedReservations() {
        return ResponseEntity.ok(googleCalendarService.getConfirmedReservations());
    }

    @DeleteMapping("/reservations/{id}")
    public ResponseEntity<Void> cancelReservation(@PathVariable String id) {
        try {
            googleCalendarService.cancelReservation(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /* -------------------- Time Slot Endpoint -------------------- */
    @GetMapping("/view")
    public ResponseEntity<?> getTimeSlots(
            @RequestParam @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String date) {
        try {
            List<CalendarSlotDTO> slots = googleCalendarService.getCalendarView(date);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Invalid date format", "details", "Use yyyy-MM-dd format"));
        }
    }
}