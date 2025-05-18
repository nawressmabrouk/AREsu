package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
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
    private final String ADMIN_EMAIL = "REDACTED_OLD_APP_EMAIL";

    @Override
    public void run(String... args) {
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
                    com.google.api.services.calendar.model.Calendar calendar = new com.google.api.services.calendar.model.Calendar();
                    calendar.setSummary(etab.getNom() + " - Reservations");
                    calendar.setTimeZone("Africa/Tunis");

                    com.google.api.services.calendar.model.Calendar createdCalendar = service.calendars()
                            .insert(calendar).execute();

                    String calendarId = createdCalendar.getId();

                    // 2. Set permissions
                    AclRule adminRule = new AclRule()
                            .setScope(new AclRule.Scope().setType("user").setValue(ADMIN_EMAIL))
                            .setRole("owner");

                    AclRule serviceAccountRule = new AclRule()
                            .setScope(new AclRule.Scope().setType("user").setValue(serviceAccountEmail))
                            .setRole("writer");

                    // Apply ACL rules
                    service.acl().insert(calendarId, adminRule).execute();
                    service.acl().insert(calendarId, serviceAccountRule).execute();

                    // 3. Automatic verification
                    boolean verified = verifyCalendarCreation(service, calendarId, etab.getNom());
                    if (!verified) {
                        throw new RuntimeException("Calendar verification failed");
                    }

                    // 4. Save to database
                    etab.setGoogleCalendarId(calendarId);
                    etab.setCalendarEmail(calendarId + "@group.calendar.google.com");
                    etablissementRepo.save(etab);

                    // 5. Send notification email
                    sendCreationNotification(etab, calendarId);

                    log.info("Successfully created and verified calendar for {}", etab.getNom());

                } catch (Exception e) {
                    log.error("Failed to create calendar for {}: {}", etab.getNom(), e.getMessage());
                    sendErrorNotification(etab, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Calendar migration failed: {}", e.getMessage());
        }

        log.info("Calendar migration process completed");
    }

    private boolean verifyCalendarCreation(Calendar service, String calendarId, String etabName) throws IOException {
        log.info("Verifying calendar creation for {}", etabName);

        // Verify calendar exists
        com.google.api.services.calendar.model.Calendar calendar = service.calendars().get(calendarId).execute();
        if (calendar == null) {
            log.error("Calendar {} not found", calendarId);
            return false;
        }

        // Verify admin permissions
        AclRule adminAcl = service.acl().get(calendarId, "user:" + ADMIN_EMAIL).execute();
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

    private void sendCreationNotification(Etablissement etab, String calendarId) throws MessagingException {
        String subject = "Calendar Created: " + etab.getNom();
        String content = String.format(
                "<h2>New Calendar Created</h2>" +
                        "<p><strong>Establishment:</strong> %s</p>" +
                        "<p><strong>Calendar ID:</strong> %s</p>" +
                        "<p><strong>Calendar Email:</strong> %s@group.calendar.google.com</p>" +
                        "<p><a href='https://calendar.google.com/calendar/r?cid=%s'>Open in Google Calendar</a></p>",
                etab.getNom(), calendarId, calendarId, calendarId);

        emailService.sendHtmlEmail(ADMIN_EMAIL, subject, content);
        log.info("Notification email sent for {}", etab.getNom());
    }

    private void sendErrorNotification(Etablissement etab, String error) throws MessagingException {
        String subject = "Calendar Creation Failed: " + etab.getNom();
        String content = String.format(
                "<h2>Calendar Creation Failed</h2>" +
                        "<p><strong>Establishment:</strong> %s</p>" +
                        "<p><strong>Error:</strong> %s</p>",
                etab.getNom(), error);

        emailService.sendHtmlEmail(ADMIN_EMAIL, subject, content);
    }
}