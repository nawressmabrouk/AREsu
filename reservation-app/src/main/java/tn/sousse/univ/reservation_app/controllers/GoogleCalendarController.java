package tn.sousse.univ.reservation_app.controllers;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Pattern;
import tn.sousse.univ.reservation_app.dto.CalendarSlotDTO;
import tn.sousse.univ.reservation_app.dto.HolidayDTO;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.services.GoogleCalendarService;
import tn.sousse.univ.reservation_app.services.HolidayService;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:4200")
public class GoogleCalendarController {

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private HolidayService holidayService;

    /**
     * Get unavailable time slots for a specific date.
     * Expected format from frontend: yyyy-MM-dd (e.g., 2025-05-03)
     */
    @GetMapping("/unavailableSlots")
    public ResponseEntity<List<String>> getUnavailableSlots(@RequestParam String date) throws IOException {
        try {
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
            Date parsedDate = formatter.parse(date);
            List<String> unavailableSlots = googleCalendarService.getUnavailableSlots(parsedDate);
            return ResponseEntity.ok(unavailableSlots);
        } catch (ParseException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get unavailable slots for a specific space and date
     */

    @GetMapping("/unavailableSlots/space")
    public ResponseEntity<List<String>> getUnavailableSlotsForSpace(
            @RequestParam String espaceId,
            @RequestParam String date) {
        try {
            List<String> unavailableSlots = googleCalendarService.getUnavailableSlotsForSpace(espaceId, date);
            return ResponseEntity.ok(unavailableSlots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/unavailableSlots/etablissement")
    public ResponseEntity<List<String>> getUnavailableSlotsForEtablissement(
            @RequestParam String etablissementId,
            @RequestParam String date) { // Keep as String
        try {
            List<String> slots = googleCalendarService
                    .getUnavailableSlotsForEtablissement(etablissementId, date);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get calendar view for a specific establishment and space
     */
    
    @GetMapping("/view")
public ResponseEntity<?> getCalendarView(
    @RequestParam String etablissementId,
    @RequestParam String espaceId,
    @RequestParam @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String date,
    @RequestHeader("X-User-Role") String userRole,
    @RequestHeader("X-User-Id") String userId) {
    
    try {
        // Clean and validate IDs
        String cleanEtablissementId = etablissementId.replaceAll("_+$", "");
        String cleanEspaceId = espaceId.replaceAll("_+$", "");
        
        if (cleanEtablissementId.isEmpty() || cleanEspaceId.isEmpty()) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Invalid ID format", "details", "IDs cannot be empty or just underscores"));
        }

        ObjectId etabId = new ObjectId(cleanEtablissementId);
        ObjectId spaceId = new ObjectId(cleanEspaceId);
        
        Role role = Role.valueOf(userRole);
        
        List<CalendarSlotDTO> slots = googleCalendarService.getCalendarView(
            etabId, spaceId, date, role, userId);
        
        return ResponseEntity.ok(slots);
        
    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(
            Map.of("message", "Invalid parameter format", "details", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(
            Map.of("message", "Error processing request", "details", e.getMessage()));
    }
}

    /**
     * Check specific availability for a time slot on a date
     */
    @GetMapping("/checkAvailability")
    public ResponseEntity<Boolean> checkSlotAvailability(
            @RequestParam String date,
            @RequestParam String espaceId) {
        boolean available = googleCalendarService.checkSlotAvailability(date, espaceId);
        return ResponseEntity.ok(available);
    }

    @GetMapping("/holidays")
    public ResponseEntity<List<HolidayDTO>> getHolidays(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        List<HolidayDTO> holidays = holidayService.getHolidaysBetween(start, end);
        return ResponseEntity.ok(holidays);
    }

    /**
     * Get slots for demandeur (internal/external)
     * 
     * @GetMapping("/demandeur/slots")
     * @PreAuthorize("hasAnyRole('DEMANDEUR_INTERNE', 'DEMANDEUR_EXTERNE')")
     * public ResponseEntity<List<CalendarSlotDTO>> getDemandeurSlots(
     * 
     * @RequestParam String etablissementId,
     * @RequestParam String espaceId,
     * @RequestParam String date,
     *               @RequestHeader("X-User-Id") String demandeurId) {
     *               try {
     *               SimpleDateFormat formatter = new
     *               SimpleDateFormat("yyyy-MM-dd");
     *               Date parsedDate = formatter.parse(date);
     * 
     *               List<CalendarSlotDTO> slots =
     *               googleCalendarService.getCalendarView(
     *               new ObjectId(etablissementId),
     *               new ObjectId(espaceId),
     *               parsedDate,
     *               Role.DEMANDEUR_INTERNE, // Or DEMANDEUR_EXTERNE based on actual
     *               role
     *               demandeurId);
     * 
     *               return ResponseEntity.ok(slots);
     *               } catch (ParseException e) {
     *               return ResponseEntity.badRequest().build();
     *               } catch (Exception e) {
     *               return ResponseEntity.internalServerError().build();
     *               }
     *               }
     */
}