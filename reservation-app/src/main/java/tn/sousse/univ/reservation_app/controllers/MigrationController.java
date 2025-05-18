package tn.sousse.univ.reservation_app.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import tn.sousse.univ.reservation_app.services.GoogleCalendarMigrationService;

@RestController
@RequestMapping("/api/migrate")
@RequiredArgsConstructor
public class MigrationController {

    private final GoogleCalendarMigrationService migrationService;

    @PostMapping("/calendars")
    public ResponseEntity<String> migrateCalendars() {
        try {
            migrationService.run(); // Calls the same migration logic
            return ResponseEntity.ok("Calendar migration started.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Migration failed: " + e.getMessage());
        }
    }
}