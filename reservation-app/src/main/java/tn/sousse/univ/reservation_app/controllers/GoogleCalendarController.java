package tn.sousse.univ.reservation_app.controllers;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Acl;
import com.google.api.services.calendar.model.AclRule;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;

import io.netty.util.internal.ThreadLocalRandom;
import jakarta.validation.constraints.Pattern;
import tn.sousse.univ.reservation_app.dto.CalendarSlotDTO;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.services.GoogleCalendarService;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:4200")
public class GoogleCalendarController {

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EtablissementRepository etablissementRepo;

    @Autowired
private ReservationRepository reservationRepo;

    @GetMapping("/reservations/dates")
    public ResponseEntity<List<String>> getReservedDates(
            @RequestParam String etablissementId) {
        try {
            return ResponseEntity.ok(googleCalendarService.getReservedDates(etablissementId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
   

   /*  @GetMapping("/reservations/confirmed")
    public ResponseEntity<List<Reservation>> getConfirmedReservations() {
        return ResponseEntity.ok(googleCalendarService.getConfirmedReservations());
    }*/

@GetMapping("/reservations/confirmed")
public ResponseEntity<List<Reservation>> getConfirmedReservations(
    @RequestParam String etablissementId) {
    
    return ResponseEntity.ok(reservationRepo.findByEtablissementIdAndStatut(
        etablissementId, StatusReservation.ACCEPTÉE));
}

@GetMapping("/reservations/pending")
public ResponseEntity<List<Reservation>> getPendingReservations(
    @RequestParam String etablissementId) {
    
    return ResponseEntity.ok(reservationRepo.findByEtablissementIdAndStatut(
        etablissementId, StatusReservation.EN_ATTENTE));
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
        @RequestParam @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String date,
        @RequestParam String etablissementId) {  // Add etablissementId parameter
    try {
        List<CalendarSlotDTO> slots = googleCalendarService.getCalendarView(date, etablissementId);
        return ResponseEntity.ok(slots);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(
                Map.of("error", "Invalid date format", "details", "Use yyyy-MM-dd format"));
    }
}

    @GetMapping("/verify")
    public ResponseEntity<String> verifyCalendars() {
        List<Etablissement> etabs = etablissementRepo.findAll();
        List<String> problems = new ArrayList<>();
        
        for (Etablissement etab : etabs) {
            if (etab.getGoogleCalendarId() == null) {
                problems.add(etab.getNom() + " has no calendar ID");
            }
        }
        
        return problems.isEmpty() 
            ? ResponseEntity.ok("All calendars configured properly")
            : ResponseEntity.badRequest().body(String.join("\n", problems));
    }

    // Add this temporary endpoint
   @GetMapping("/test-visibility/{calendarId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> testVisibility(
            @PathVariable String calendarId) {
        try {
            googleCalendarService.makeCalendarVisible(calendarId);
            return ResponseEntity.ok(
                String.format("Successfully made calendar %s visible", calendarId));
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 404) {
                return ResponseEntity.status(404).body("Calendar not found: " + calendarId);
            }
            return ResponseEntity.status(e.getStatusCode())
                .body("Google API error: " + e.getMessage());
        } catch (GeneralSecurityException e) {
            return ResponseEntity.status(500)
                .body("Security configuration error: " + e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(500)
                .body("Communication error: " + e.getMessage());
        }
    }


    //Verify Calendar Existence (API-Level Check)
@GetMapping("/verify-calendar/{calendarId}")
public ResponseEntity<?> verifyCalendar(@PathVariable String calendarId) {
    try {
        // Get basic calendar info
        com.google.api.services.calendar.model.Calendar calendar = 
            googleCalendarService.getCalendarService()
                .calendars()
                .get(calendarId)
                .execute();

        // Get ACL rules to find owner
        Acl acl = googleCalendarService.getCalendarService()
            .acl()
            .list(calendarId)
            .execute();

        // Find owner email
        String ownerEmail = acl.getItems().stream()
            .filter(rule -> "owner".equals(rule.getRole()))
            .findFirst()
            .map(rule -> rule.getScope().getValue())
            .orElse("unknown");

        return ResponseEntity.ok(Map.of(
            "exists", true,
            "summary", calendar.getSummary(),
            "timeZone", calendar.getTimeZone(),
            "owner", ownerEmail,  // Now shows real owner
            "visibility", getCalendarVisibility(calendarId)
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body(Map.of("error", e.getMessage()));
    }
}

private String getCalendarVisibility(String calendarId) throws IOException, GeneralSecurityException {
    try {
        CalendarListEntry entry = googleCalendarService.getCalendarService()
            .calendarList()
            .get(calendarId)
            .execute();
        return entry.getSelected() ? "visible" : "hidden";
    } catch (GoogleJsonResponseException e) {
        return "not-in-list";
    }
}

//Check Calendar Visibility Settings
@GetMapping("/visibility-status/{calendarId}")
public ResponseEntity<?> getVisibilityStatus(@PathVariable String calendarId) {
    try {
        CalendarListEntry entry = googleCalendarService.getCalendarService()
            .calendarList()
            .get(calendarId)
            .execute();
        
        return ResponseEntity.ok(Map.of(
            "selected", entry.getSelected(),
            "hidden", entry.getHidden() != null && entry.getHidden(),
            "accessRole", entry.getAccessRole()
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body(Map.of("error", e.getMessage()));
    }
}
//For more detailed calendar info
@GetMapping("/calendar-details/{calendarId}")
public ResponseEntity<?> getCalendarDetails(@PathVariable String calendarId) {
    try {
        CalendarListEntry entry = googleCalendarService.getCalendarService()
            .calendarList()
            .get(calendarId)
            .execute();
        
        return ResponseEntity.ok(Map.of(
            "summary", entry.getSummary(),
            "description", entry.getDescription(),
            "timeZone", entry.getTimeZone(),
            "accessRole", entry.getAccessRole(),
            "selected", entry.getSelected()
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body(Map.of("error", e.getMessage()));
    }
}

// Additional verification endpoint
@GetMapping("/check-ui-status/{calendarId}")
public ResponseEntity<?> checkUIStatus(@PathVariable String calendarId) {
    try {
        CalendarListEntry entry = googleCalendarService.getCalendarService()
            .calendarList()
            .get(calendarId)
            .execute();

        return ResponseEntity.ok(Map.of(
            "visibleInUI", entry.getSelected(),
            "colorId", entry.getColorId(), // Check if styled
            "notificationSettings", entry.getNotificationSettings()
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}

@PostMapping("/grant-access/{calendarId}")
public ResponseEntity<?> grantAccess(
    @PathVariable String calendarId,
    @RequestParam String userEmail) {
    
    try {
        googleCalendarService.grantUserAccess(calendarId, userEmail);
        return ResponseEntity.ok(Map.of(
            "status", "access_granted",
            "calendarId", calendarId,
            "userEmail", userEmail,
            "permissionLevel", "reader"
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500)
            .body(Map.of("error", e.getMessage()));
    }
}

@GetMapping("/check-all-visibility")
public ResponseEntity<?> checkAllCalendars() {
    List<Etablissement> etabs = etablissementRepo.findAll();
    List<Map<String, Object>> results = new ArrayList<>();

    etabs.forEach(etab -> {
        Map<String, Object> info = new HashMap<>();
        info.put("establishment", etab.getNom());
        info.put("calendarId", etab.getGoogleCalendarId());
        
        try {
            CalendarListEntry entry = googleCalendarService.getCalendarService()
                .calendarList()
                .get(etab.getGoogleCalendarId())
                .execute();
            
            info.put("uiVisibility", entry.getSelected() ? "visible" : "hidden");
            info.put("accessRole", entry.getAccessRole());
        } catch (Exception e) {
            info.put("uiVisibility", "not-found");
        }
        
        results.add(info);
    });

    return ResponseEntity.ok(results);
}
@PostMapping("/share-all-with-user")
public ResponseEntity<?> shareAllCalendars(@RequestParam String userEmail) {
    List<Etablissement> etabs = etablissementRepo.findAll();
    List<String> sharedCalendars = new ArrayList<>();

    etabs.forEach(etab -> {
        try {
            // 1. Grant view permissions
            AclRule rule = new AclRule()
                .setScope(new AclRule.Scope()
                    .setType("user")
                    .setValue(userEmail))
                .setRole("reader");

            googleCalendarService.getCalendarService()
                .acl()
                .insert(etab.getGoogleCalendarId(), rule)
                .execute();

            // 2. Force UI refresh
            CalendarListEntry update = new CalendarListEntry()
                .setSelected(true)
                .setColorId(String.valueOf(ThreadLocalRandom.current().nextInt(1, 25)));

            googleCalendarService.getCalendarService()
                .calendarList()
                .update(etab.getGoogleCalendarId(), update)
                .execute();

            sharedCalendars.add(etab.getNom());
        } catch (Exception e) {
        }
    });

    return ResponseEntity.ok(Map.of(
        "sharedCount", sharedCalendars.size(),
        "sharedCalendars", sharedCalendars,
        "userEmail", userEmail
    ));
}
@PostMapping("/force-all-ui-visibility")
public ResponseEntity<?> forceAllUIVisibility() {
    List<Etablissement> etabs = etablissementRepo.findAll();
    List<String> updatedCalendars = new ArrayList<>();

    etabs.forEach(etab -> {
        try {
            // 1. Ensure unique naming
            String uniqueName = etab.getNom() + " Reservations";
            
            // 2. Update calendar list entry
            CalendarListEntry update = new CalendarListEntry()
                .setSelected(true)
                .setHidden(false)
                .setSummary(uniqueName)
                .setColorId(getRandomColorId())
                .setDefaultReminders(List.of(
                    new EventReminder().setMethod("popup").setMinutes(10)
                ));

            googleCalendarService.getCalendarService()
                .calendarList()
                .update(etab.getGoogleCalendarId(), update)
                .execute();

            updatedCalendars.add(uniqueName);
        } catch (Exception e) {
        }
    });

    return ResponseEntity.ok(Map.of(
        "updatedCount", updatedCalendars.size(),
        "updatedCalendars", updatedCalendars
    ));
}

private String getRandomColorId() {
    return String.valueOf(new Random().nextInt(24) + 1); // Google's color range 1-24
}

@PostMapping("/add-test-events")
public ResponseEntity<?> addTestEvents() {
    List<Etablissement> etabs = etablissementRepo.findAll();
    DateTime now = new DateTime(System.currentTimeMillis());
    
    etabs.forEach(etab -> {
        try {
            Event event = new Event()
                .setSummary("Test Event")
                .setStart(new EventDateTime().setDateTime(now))
                .setEnd(new EventDateTime().setDateTime(new DateTime(now.getValue() + 3600000)));

            googleCalendarService.getCalendarService()
                .events()
                .insert(etab.getGoogleCalendarId(), event)
                .execute();
        } catch (Exception e) {
        }
    });
    
    return ResponseEntity.ok("Test events added to all calendars");
}

@PostMapping("/fix-ui-display")
public ResponseEntity<?> fixAllUIDisplay() {
    List<Etablissement> etabs = etablissementRepo.findAll();
    etabs.forEach(etab -> {
        try {
            googleCalendarService.forceCalendarDisplay(etab.getGoogleCalendarId());
        } catch (Exception e) {
        }
    });
    return ResponseEntity.ok("All calendars forced to display");
}

//just for checking
   @GetMapping("/{calendarId}/reservations")
    public ResponseEntity<?> getCalendarReservations(
            @PathVariable String calendarId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            // Option 1: Get from Google Calendar API directly
            List<Event> events = googleCalendarService.getEventsForCalendar(calendarId, date);
            
            // Option 2: Get from your database (faster)
            // List<Reservation> reservations = reservationRepository.findByGoogleCalendarId(calendarId);
            
            return ResponseEntity.ok(events);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch calendar events: " + e.getMessage()));
        }
    }
    //to delet all the existing events
  @DeleteMapping("/cleanup")
    public ResponseEntity<?> cleanupAllCalendars(
            @RequestParam(defaultValue = "false") boolean dryRun) {
        
        try {
            List<Etablissement> etablissements = etablissementRepo.findAll();
            Map<String, Integer> results = new HashMap<>();

            for (Etablissement etab : etablissements) {
                if (etab.getGoogleCalendarId() != null) {
                    int deleted = googleCalendarService.cleanupCalendar(
                        etab.getGoogleCalendarId(), 
                        dryRun
                    );
                    results.put(etab.getNom(), deleted);
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", dryRun ? "Dry run completed" : "All calendars cleaned up",
                "results", results
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Cleanup failed: " + e.getMessage()));
        }
    }
}
