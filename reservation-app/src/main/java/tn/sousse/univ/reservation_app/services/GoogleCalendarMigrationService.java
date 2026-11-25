package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.AclRule;
import com.google.api.services.calendar.model.CalendarListEntry;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class GoogleCalendarMigrationService implements CommandLineRunner {

    private final EtablissementRepository etablissementRepo;
    private final GoogleCalendarService googleCalendarService;
    private final EmailService emailService; // Assume you have an email service
    // Owner of the created calendars and recipient of error notifications:
    // the application's mail account (MAIL_USERNAME).
    @Value("${spring.mail.username:}")
    private String adminEmail;

    @Override

    public void run(String... args) throws MessagingException {
        if (!googleCalendarService.isEnabled()) {
            log.info("Google Calendar désactivé : création des calendriers d'établissement ignorée.");
            return;
        }
        log.info("Starting Google Calendar migration for Etablissements...");

        try {
            List<Etablissement> etablissements = etablissementRepo.findByGoogleCalendarIdIsNull();

            if (etablissements.isEmpty()) {
                log.info("No Etablissements need calendar migration.");
                return;
            }

            log.info("Found {} Etablissements needing calendars", etablissements.size());
            Calendar service = googleCalendarService.getGoogleCalendarClient();
            String serviceAccountEmail = googleCalendarService.getServiceAccountEmail();

            for (Etablissement etab : etablissements) {
                try {
                    // 1. Create calendar
                    com.google.api.services.calendar.model.Calendar calendar = new com.google.api.services.calendar.model.Calendar()
                            .setSummary(etab.getNom() + " - Reservations")
                            .setTimeZone("Africa/Tunis")
                            .setDescription("Reservations for " + etab.getNom());

                    com.google.api.services.calendar.model.Calendar createdCalendar = service.calendars()
                            .insert(calendar).execute();
                    String calendarId = createdCalendar.getId();

                    // 2. Make calendar visible in UI (CRITICAL FIX)
                    try {
                        googleCalendarService.makeCalendarVisible(calendarId);
                        log.info("Made calendar visible in UI: {}", calendarId);
                    } catch (Exception e) {
                        log.warn("Failed to make calendar visible (non-critical): {}", e.getMessage());
                    }

                    // 3. Share with the application's mail account. The service account
                    // created the calendar, so it is already its owner: Google refuses
                    // any ACL change on its own access (403 cannotChangeOwnAcl).
                    if (adminEmail != null && !adminEmail.isBlank()
                            && !adminEmail.equalsIgnoreCase(serviceAccountEmail)) {
                        try {
                            AclRule adminRule = new AclRule()
                                    .setScope(new AclRule.Scope().setType("user").setValue(adminEmail))
                                    .setRole("owner");
                            service.acl().insert(calendarId, adminRule).execute();
                        } catch (Exception e) {
                            log.warn("Could not share calendar {} with {} (non-critical): {}",
                                    calendarId, adminEmail, e.getMessage());
                        }
                    }

                    // 4. Verify calendar
                    if (!verifyCalendarCreation(service, calendarId, etab.getNom())) {
                        throw new RuntimeException("Calendar verification failed");
                    }

                    // 5. Save to database
                    etab.setGoogleCalendarId(calendarId);
                    etab.setCalendarEmail(calendarId + "@group.calendar.google.com");
                    etablissementRepo.save(etab);

                    log.info("Successfully created calendar for {} (ID: {})",
                            etab.getNom(), calendarId);

                } catch (Exception e) {
                    log.error("FAILED to create calendar for {}: {}", etab.getNom(), e.getMessage());
                    sendErrorNotification(etab, e.getMessage());

                    // Optional: Add retry logic here
                }
            }
        } catch (Exception e) {
            log.error("FATAL: Calendar migration failed: {}", e.getMessage());
            emailService.sendHtmlEmail(
                    adminEmail,
                    "CALENDAR MIGRATION FAILURE",
                    "Critical error: " + e.getMessage());
        } finally {
            log.info("Calendar migration process completed");
            // Add any cleanup logic here
        }
    }

    // Verifies the calendar creation by checking
    private boolean verifyCalendarCreation(Calendar service, String calendarId, String etabName) throws IOException {
        log.info("Verifying calendar creation for {}", etabName);

        // Verify calendar exists
        com.google.api.services.calendar.model.Calendar calendar = service.calendars().get(calendarId).execute();
        if (calendar == null) {
            log.error("Calendar {} not found", calendarId);
            return false;
        }

        // Verify admin permissions
        AclRule adminAcl = service.acl().get(calendarId, "user:" + adminEmail).execute();
        if (!"owner".equals(adminAcl.getRole())) {
            log.error("Admin permissions not set correctly");
            return false;
        }

        // Verify service account permissions
        String serviceAccountEmail = googleCalendarService.getServiceAccountEmail();
        AclRule serviceAcl = service.acl().get(calendarId, "user:" + serviceAccountEmail).execute();
        if (!"writer".equals(serviceAcl.getRole())) {
            log.error("Service account permissions not set correctly");
            return false;
        }

        // Verify calendar appears in list
        CalendarListEntry calendarListEntry = service.calendarList().get(calendarId).execute();
        if (calendarListEntry == null) {
            log.error("Calendar not found in calendar list");
            return false;
        }

        log.info("Verification successful for calendar {}", calendarId);
        return true;

    }

    // This method sends an error notification if calendar creation fails.
    private void sendErrorNotification(Etablissement etab, String error) throws MessagingException {
        String subject = "Calendar Creation Failed: " + etab.getNom();
        String content = String.format(
                "<h2>Calendar Creation Failed</h2>" +
                        "<p><strong>Establishment:</strong> %s</p>" +
                        "<p><strong>Error:</strong> %s</p>",
                etab.getNom(), error);

        emailService.sendHtmlEmail(adminEmail, subject, content);
    }

    @Scheduled(cron = "0 0 9 * * ?")
    public void checkCalendarAssignments() {
        log.info("Running daily calendar verification...");
        List<Etablissement> etabsWithoutCalendars = etablissementRepo.findByGoogleCalendarIdIsNull();

        if (!etabsWithoutCalendars.isEmpty()) {
            log.warn("Found {} establishments without calendars:", etabsWithoutCalendars.size());
            etabsWithoutCalendars.forEach(etab -> log.warn(" - {} (ID: {})", etab.getNom(), etab.getId()));

        } else {
            log.info("All establishments have calendars configured");
        }
    }
}