package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Acl;
import com.google.api.services.calendar.model.AclRule;
import com.google.api.services.calendar.model.CalendarListEntry;
import com.google.api.services.calendar.model.CalendarNotification;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;

import tn.sousse.univ.reservation_app.config.GoogleCalendarConfig;
import tn.sousse.univ.reservation_app.config.GoogleCalendarUnavailableException;
import tn.sousse.univ.reservation_app.dto.CalendarSlotDTO;
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;

@Service
public class GoogleCalendarService {
    // Logger for tracking service activity
    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarService.class);
    // Formatter for date strings (e.g., "2023-10-05")
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    // Required OAuth2 scope for Google Calendar access
    private static final List<String> SCOPES = Collections.singletonList("https://www.googleapis.com/auth/calendar");
    // Predefined Tunisian holiday calendar IDs (fallback options)
    private static final String[] TUNISIAN_HOLIDAY_CALENDAR_IDS = { "en.tunisia#holiday@group.v.calendar.google.com",
            "tunisian.official#holiday@group.v.calendar.google.com",
            "ar.tn#holiday@group.v.calendar.google.com",
            "en.tn#holiday@group.v.calendar.google.com" };

    // Configuration properties (e.g., service account key)
    private final GoogleCalendarConfig calendarProperties;
    // MongoDB repository for reservations
    private final ReservationRepository reservationRepository;
    // Google API credentials
    private final GoogleCredentials credentials;
    // Tunis time zone for slot generation
    private static final ZoneId TUNIS_ZONE = ZoneId.of("Africa/Tunis");
    // Unused MongoTemplate (potential future use)
    private MongoTemplate mongoTemplate;

    private final EtablissementRepository etablissementRepo;

    public GoogleCalendarService(GoogleCalendarConfig calendarProperties, ReservationRepository reservationRepository,
            EtablissementRepository etablissementRepo)
            throws IOException {
        this.calendarProperties = calendarProperties;
        this.reservationRepository = reservationRepository;
        this.etablissementRepo = etablissementRepo;

        // Load credentials from the service account key. If it is missing or invalid the
        // integration is disabled (isEnabled() == false) instead of aborting startup.
        GoogleCredentials loaded = null;
        if (calendarProperties.isServiceAccountKeyAvailable()) {
            try (java.io.InputStream in = calendarProperties.getServiceAccountKey().getInputStream()) {
                loaded = GoogleCredentials.fromStream(in).createScoped(SCOPES);
            } catch (IOException e) {
                logger.warn("Google Calendar désactivé : clé du compte de service illisible ({})", e.getMessage());
            }
        }
        this.credentials = loaded;
    }

    /** True when the service-account credentials could be loaded. */
    public boolean isEnabled() {
        return credentials != null;
    }

    // Retrieves all reserved dates for a specific establishment and space
    // (including tunisian holidays)
    public List<String> getReservedDates(String etablissementId, String espaceId) {
        Set<String> reservedDates = new HashSet<>();
        try {
            // Get space-specific reservations
            List<Reservation> reservations = reservationRepository
                    .findByEtablissementIdAndEspaceIdAndStatut(
                            etablissementId,
                            espaceId,
                            StatusReservation.ACCEPTÉE);

            // Convert to date strings
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            for (Reservation res : reservations) {
                if (res.getHeureDebut() != null) {
                    reservedDates.add(sdf.format(res.getHeureDebut()));
                }
            }

            boolean foundHolidays = false;
            // Public holidays come from Google Calendar: skipped when the integration is disabled
            for (String calendarId : isEnabled() ? TUNISIAN_HOLIDAY_CALENDAR_IDS : new String[0]) {
                try {
                    reservedDates.addAll(getReservationsFromCalendar(getCalendarService(), calendarId));
                    foundHolidays = true;
                    break;
                } catch (IOException e) {
                    logger.warn("Failed to fetch from holiday calendar: {}", calendarId);
                }
            }

            return new ArrayList<>(reservedDates);
        } catch (Exception e) {
            logger.error("Error getting reserved dates", e);
            throw new RuntimeException("Calendar service error", e);
        }
    }

    // Formats a Date object into "yyyy-MM-dd" string format
    private String formatDate(Date date) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(date);
    }

    // Fetches event start dates from a specified Google Calendar
    private List<String> getReservationsFromCalendar(Calendar service, String calendarId) throws IOException {
        List<String> dates = new ArrayList<>();
        // Build API request to list events
        Events events = service.events().list(calendarId)
                .setTimeMin(new DateTime(System.currentTimeMillis())) // Events from now onward
                .setSingleEvents(true) // Expand recurring events
                .setOrderBy("startTime") // Chronological order
                .execute();

        // Extract start dates from events
        for (Event event : events.getItems()) {
            DateTime start = event.getStart().getDateTime();
            if (start == null) {
                start = event.getStart().getDate(); // Handle all-day events
            }
            if (start != null) {
                dates.add(new java.util.Date(start.getValue()).toString().substring(0, 10)); // Format to "yyyy-MM-dd"
            }
        }
        return dates;
    }

    // Confirms a reservation by creating a Google Calendar event (ObjectId version)
    public Reservation confirmReservation(ObjectId reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        try {
            // ADDED VALIDATION
            if (reservation.getEtablissementId() == null) {
                throw new IllegalStateException("Reservation has no establishment ID");
            }

            Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
                    .orElseThrow(() -> new RuntimeException("Etablissement not found"));

            // ADDED CALENDAR ID VALIDATION
            if (etab.getGoogleCalendarId() == null) {
                throw new IllegalStateException("Establishment has no calendar configured");
            }

            Event calendarEvent = createCalendarEvent(reservation);
            Event createdEvent = getCalendarService().events()
                    .insert(etab.getGoogleCalendarId(), calendarEvent)
                    .execute();

            reservation.setGoogleEventId(createdEvent.getId());
            return reservationRepository.save(reservation);
        } catch (Exception e) {
            logger.error("Reservation confirmation failed", e);
            throw new RuntimeException("Reservation confirmation error", e);
        }
    }

    // Creates a Google Calendar Event from a Reservation object
    private Event createCalendarEvent(Reservation reservation) {
        return new Event()
                .setSummary(reservation.getIntituleAction()) // Event title
                .setDescription(reservation.getDescription()) // Event details
                .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut()))) // Start time
                .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin()))); // End time
    }

    // Cancels a reservation by deleting its Google Calendar event (ObjectId
    // version)
    public void cancelReservation(ObjectId reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        try {
            if (reservation.getGoogleEventId() != null) {
                Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
                        .orElseThrow(() -> new RuntimeException("Etablissement not found"));

                getCalendarService().events()
                        .delete(etab.getGoogleCalendarId(), reservation.getGoogleEventId())
                        .execute();
            }
            reservationRepository.delete(reservation);
        } catch (IOException | GeneralSecurityException e) {
            logger.error("Reservation cancellation failed", e);
            throw new RuntimeException("Cancellation error", e);
        }
    }

    // Initializes and returns an authenticated Google Calendar API client
    public Calendar getCalendarService() throws GeneralSecurityException, IOException {
        if (!isEnabled()) {
            throw new GoogleCalendarUnavailableException();
        }
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        return new Calendar.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Reservation System")
                .build();
    }

    // Retrieves reservations without Google Calendar event IDs
    public List<Reservation> getUnconfirmedReservations() {
        return reservationRepository.findByGoogleEventIdNull();
    }

    // Retrieves reservations that have Google Calendar event IDs
    public List<Reservation> getConfirmedReservations() {
        return reservationRepository.findByGoogleEventIdNotNull();
    }

    // Retrieves reservations with EN_ATTENTE (pending) status
    public List<Reservation> getPendingReservations() {
        return reservationRepository.findByStatut(StatusReservation.EN_ATTENTE);
    }

    // Retrieves reservations with ACCEPTÉE (accepted) status
    public List<Reservation> getAcceptedReservations() {
        return reservationRepository.findByStatut(StatusReservation.ACCEPTÉE);
    }

    // Confirms a reservation (String ID version) with status validation
    public Reservation confirmReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
            throw new IllegalStateException("Reservation is not in pending state");
        }

        try {
            Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
                    .orElseThrow(() -> new RuntimeException("Etablissement not found"));

            Event calendarEvent = createCalendarEvent(reservation);
            Event createdEvent = getCalendarService().events()
                    .insert(etab.getGoogleCalendarId(), calendarEvent)
                    .execute();

            reservation.setStatut(StatusReservation.ACCEPTÉE);
            reservation.setGoogleEventId(createdEvent.getId());
            return reservationRepository.save(reservation);
        } catch (Exception e) {
            logger.error("Reservation confirmation failed", e);
            throw new RuntimeException("Reservation confirmation error", e);
        }
    }

    // Cancels a reservation (String ID version) and updates its status
    public void cancelReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        try {
            if (reservation.getGoogleEventId() != null) {
                // Get the establishment's calendar
                Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
                        .orElseThrow(() -> new RuntimeException("Etablissement not found"));

                getCalendarService().events()
                        .delete(etab.getGoogleCalendarId(), reservation.getGoogleEventId())
                        .execute();
            }
            reservation.setStatut(StatusReservation.ANNULÉE);
            reservationRepository.save(reservation);
        } catch (IOException | GeneralSecurityException e) {
            logger.error("Reservation cancellation failed", e);
            throw new RuntimeException("Cancellation error", e);
        }
    }

    // Generates 30-minute time slots for a given date in Tunis timezone
    private List<CalendarSlotDTO> generateTimeSlots(Date date) {
        List<CalendarSlotDTO> slots = new ArrayList<>();
        ZonedDateTime zonedDate = date.toInstant().atZone(TUNIS_ZONE);
        LocalDate localDate = zonedDate.toLocalDate();

        LocalTime startTime = LocalTime.of(8, 0); // Start at 08:00
        LocalTime endTime = LocalTime.of(18, 0); // End at 18:00

        // Generate slots every 30 minutes
        while (startTime.isBefore(endTime)) {
            CalendarSlotDTO slot = new CalendarSlotDTO();

            // Convert to Tunis time zone
            ZonedDateTime startZdt = ZonedDateTime.of(localDate, startTime, TUNIS_ZONE);
            ZonedDateTime endZdt = startZdt.plusMinutes(30);

            slot.setHeureDebut(Date.from(startZdt.toInstant()));
            slot.setHeureFin(Date.from(endZdt.toInstant()));

            // Initialize slot properties
            slot.setReserved(false);
            slot.setSelectable(true);
            slot.setUsersReservation(false);
            slot.setEtablissementReserved(false);

            slots.add(slot);
            startTime = startTime.plusMinutes(30);
        }
        return slots;
    }

    // Returns time slots for a specific date with reservation status
    public List<CalendarSlotDTO> getCalendarView(String dateString, String etablissementId) throws ParseException {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        Date date = format.parse(dateString);

        // Create start and end of day using java.util.Calendar
        java.util.Calendar calendar = java.util.Calendar.getInstance();
        calendar.setTime(date);
        calendar.set(java.util.Calendar.HOUR_OF_DAY, 0);
        calendar.set(java.util.Calendar.MINUTE, 0);
        calendar.set(java.util.Calendar.SECOND, 0);
        Date startOfDay = calendar.getTime();

        calendar.set(java.util.Calendar.HOUR_OF_DAY, 23);
        calendar.set(java.util.Calendar.MINUTE, 59);
        calendar.set(java.util.Calendar.SECOND, 59);
        Date endOfDay = calendar.getTime();

        List<CalendarSlotDTO> slots = generateTimeSlots(date);
        List<Reservation> reservations = reservationRepository
                .findByEtablissementIdAndHeureDebutBetween(etablissementId, startOfDay, endOfDay);
        // Mark reserved slots
        for (Reservation res : reservations) {
            for (CalendarSlotDTO slot : slots) {
                if (isSlotReserved(slot, res)) {
                    slot.setReserved(true);
                    slot.setSelectable(res.getStatut() != StatusReservation.ACCEPTÉE);
                }
            }
        }

        return slots;
    }

    // Checks if a time slot is reserved by comparing with a reservation
    private boolean isSlotReserved(CalendarSlotDTO slot, Reservation res) {
        return slot.getHeureDebut().equals(res.getHeureDebut())
                && slot.getHeureFin().equals(res.getHeureFin());
    }

    // Checks if a space is available during a specified time range
    public boolean isEspaceDisponible(ObjectId espaceId, Date startDate, Date endDate) throws IOException {
        try {
            String calendarId = espaceId.toString();
            Calendar service = getCalendarService();
            // Query events in the specified range
            Events events = service.events().list(calendarId)
                    .setTimeMin(new DateTime(startDate))
                    .setTimeMax(new DateTime(endDate))
                    .setSingleEvents(true)
                    .setOrderBy("startTime")
                    .execute();

            return events.getItems().isEmpty(); // Available if no events found
        } catch (GeneralSecurityException e) {
            logger.error("Security exception while checking space availability", e);
            throw new IOException("Failed to check space availability", e);
        }
    }

    // Returns the Google Calendar client (alias for getCalendarService)
    public Calendar getGoogleCalendarClient() throws GeneralSecurityException, IOException {
        return getCalendarService();
    }

    // creates a new Google Calendar for an establishment.
    public String createCalendarForEtablissement(Etablissement etablissement)
            throws GeneralSecurityException, IOException {

        // Initialize Google Calendar API client
        Calendar service = getCalendarService();

        // Define calendar properties
        com.google.api.services.calendar.model.Calendar calendar = new com.google.api.services.calendar.model.Calendar();

        calendar.setSummary(etablissement.getNom() + " - Reservations");
        calendar.setTimeZone("Africa/Tunis");
        calendar.setDescription("Reservations for " + etablissement.getNom());

        // Create the calendar
        com.google.api.services.calendar.model.Calendar createdCalendar = service.calendars().insert(calendar)
                .execute();

        // Return the calendar ID (e.g., "abc123@group.calendar.google.com")
        return createdCalendar.getId();
    }

    // Retrieves the service account email from credentials
    public String getServiceAccountEmail() throws IOException {
        if (!isEnabled()) {
            throw new GoogleCalendarUnavailableException();
        }
        // Load the service account credentials from the JSON file
        GoogleCredentials credentials = GoogleCredentials.fromStream(
                calendarProperties.getServiceAccountKey().getInputStream())
                .createScoped(SCOPES);

        if (credentials instanceof ServiceAccountCredentials) {
            return ((ServiceAccountCredentials) credentials).getClientEmail();
        }
        throw new IllegalStateException("Expected service account credentials");
    }

    // Verifies and logs permissions for a specific calendar
    public void verifyCalendarPermissions(String calendarId) throws IOException, GeneralSecurityException {
        Calendar service = getCalendarService();
        Acl acl = service.acl().list(calendarId).execute();

        logger.info("Permissions for calendar {}:", calendarId);
        acl.getItems().forEach(rule -> {
            logger.info("- Scope: {} (Role: {})",
                    rule.getScope().getValue(),
                    rule.getRole());
        });

        // Check if service account has writer role
        String serviceAccountEmail = getServiceAccountEmail();
        boolean hasAccess = acl.getItems().stream()
                .anyMatch(rule -> rule.getScope().getType().equals("user") &&
                        rule.getScope().getValue().equals(serviceAccountEmail) &&
                        rule.getRole().equals("writer"));

        if (!hasAccess) {
            throw new IllegalStateException(
                    "Service account lacks writer permissions on calendar: " + calendarId);
        }
    }

    // Makes a calendar visible in the Google Calendar UI
    public void makeCalendarVisible(String calendarId) throws IOException, GeneralSecurityException {
        try {
            CalendarListEntry calendarListEntry = new CalendarListEntry()
                    .setId(calendarId)
                    .setSelected(true);

            getCalendarService()
                    .calendarList()
                    .insert(calendarListEntry)
                    .execute();

            logger.info("Successfully made calendar visible: {}", calendarId);
        } catch (GoogleJsonResponseException e) {
            if (e.getStatusCode() == 409) {
                logger.debug("Calendar {} already visible", calendarId);
            } else {
                throw new IOException("Failed to make calendar visible: " + e.getMessage(), e);
            }
        }
    }

    // Grants user access (read/write) to a calendar
    public void grantUserAccess(String calendarId, String userEmail)
            throws IOException, GeneralSecurityException {

        // Set "reader" permissions for the user
        AclRule userRule = new AclRule()
                .setScope(new AclRule.Scope()
                        .setType("user")
                        .setValue(userEmail))
                .setRole("reader"); // Can be "writer" if needed

        getCalendarService()
                .acl()
                .insert(calendarId, userRule)
                .execute();
    }

    // Forces calendar display with custom settings
    public void forceCalendarDisplay(String calendarId) throws IOException, GeneralSecurityException {
        // Create notification object
        CalendarNotification notification = new CalendarNotification()
                .setMethod("email")
                .setType("eventCreation");

        // Configure calendar list entry
        CalendarListEntry update = new CalendarListEntry()
                .setSummary(getUniqueName(calendarId))
                .setSelected(true)
                .setHidden(false)
                .setColorId(getColorForCalendar(calendarId))
                .setBackgroundColor(getHexColor(calendarId))
                .setNotificationSettings(new CalendarListEntry.NotificationSettings()
                        .setNotifications(Collections.singletonList(notification)));

        // Apply changes
        getCalendarService()
                .calendarList()
                .update(calendarId, update)
                .execute();
    }

    // Generates a unique display name for a calendar
    private String getUniqueName(String calendarId) {
        // Extract establishment ID from calendar ID
        String establishmentId = calendarId.substring(0, 8); // First 8 chars of hash
        Etablissement etab = etablissementRepo.findByGoogleCalendarId(calendarId);
        return etab.getNom() + " [" + establishmentId + "]"; // e.g., "Medicine [a1b2c3d4]"
    }

    // Assigns a deterministic color index for calendar display
    private String getColorForCalendar(String calendarId) {
        // Deterministic color based on calendar ID hash
        int colorIndex = Math.abs(calendarId.hashCode() % 24) + 1; // Google's 24 color palette
        return String.valueOf(colorIndex);
    }

    // Generates a deterministic hex color code for calendar display
    private String getHexColor(String calendarId) {
        // Generate a deterministic hex color
        return String.format("#%06x", calendarId.hashCode() & 0xFFFFFF);
    }

    // Retrieves events for a calendar on a specific date
    public List<Event> getEventsForCalendar(String calendarId, LocalDate date)
            throws GeneralSecurityException, IOException {

        Calendar service = getCalendarService();

        // Handle date conversion properly
        DateTime startTime = date != null
                ? new DateTime(
                        date.atStartOfDay() // Convert to LocalDateTime at midnight
                                .atZone(ZoneId.of("Africa/Tunis")) // Convert to ZonedDateTime
                                .toInstant() // Convert to Instant
                                .toEpochMilli() // Convert to milliseconds
                )
                : new DateTime(System.currentTimeMillis());

        DateTime endTime = date != null
                ? new DateTime(
                        date.plusDays(1) // Next day
                                .atStartOfDay() // Midnight of next day
                                .atZone(ZoneId.of("Africa/Tunis"))
                                .toInstant()
                                .toEpochMilli())
                : null;

        Events events = service.events().list(calendarId)
                .setTimeMin(startTime)
                .setTimeMax(endTime)
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        return events.getItems();
    }

    // deletes all events from a calendar
    public int cleanupCalendar(String calendarId, boolean dryRun)
            throws GeneralSecurityException, IOException {

        Calendar service = getCalendarService();
        int deletedCount = 0;
        String pageToken = null;

        do {
            Events events = service.events().list(calendarId)
                    .setPageToken(pageToken)
                    .execute();

            for (Event event : events.getItems()) {
                if (!dryRun) {
                    service.events().delete(calendarId, event.getId()).execute();
                }
                deletedCount++;
            }

            pageToken = events.getNextPageToken();
        } while (pageToken != null);

        return deletedCount;
    }
}
