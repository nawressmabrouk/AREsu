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
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.Events;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;

import tn.sousse.univ.reservation_app.config.GoogleCalendarConfig;
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

    /**
     * Constructor: Initializes Google Calendar credentials using a service account
     * key.
     * 
     * @param calendarProperties    Configuration properties for Google Calendar
     * @param reservationRepository Repository for reservation data
     * @throws IOException If credentials initialization fails
     */
    public GoogleCalendarService(GoogleCalendarConfig calendarProperties, ReservationRepository reservationRepository, EtablissementRepository etablissementRepo)
            throws IOException {
        this.calendarProperties = calendarProperties;
        this.reservationRepository = reservationRepository;
        this.etablissementRepo = etablissementRepo;

        try {
            // Load credentials from the service account key
            this.credentials = GoogleCredentials.fromStream(calendarProperties.getServiceAccountKey().getInputStream())
                    .createScoped(SCOPES);
        } catch (IOException e) {
            logger.error("Failed to initialize Google Calendar credentials", e);
            throw new RuntimeException("Failed to initialize Google Calendar credentials", e);
        }
    }

    /**
     * Fetches all reserved dates from:
     * 1. Primary calendar (configured in properties)
     * 2. Tunisian holiday calendars (fallback to multiple IDs)
     * 
     * @return List of unique reserved dates in "yyyy-MM-dd" format
     */
 
 public List<String> getReservedDates(String etablissementId) {
    Set<String> reservedDates = new HashSet<>();
    try {
        Etablissement etab = etablissementRepo.findById(etablissementId)
            .orElseThrow(() -> new RuntimeException("Etablissement not found"));
        
        Calendar service = getCalendarService();
        
        // 1. Fetch from establishment's calendar
        reservedDates.addAll(getReservationsFromCalendar(service, etab.getGoogleCalendarId()));
        
        // 2. Attempt to fetch from Tunisian holiday calendars
        boolean foundHolidays = false;
        for (String calendarId : TUNISIAN_HOLIDAY_CALENDAR_IDS) {
            try {
                reservedDates.addAll(getReservationsFromCalendar(service, calendarId));
                foundHolidays = true;
                logger.info("Successfully fetched holidays from: {}", calendarId);
                break;
            } catch (IOException e) {
                logger.warn("Failed to fetch from: {} - {}", calendarId, e.getMessage());
            }
        }
        
        if (!foundHolidays) {
            logger.warn("No holiday calendars could be accessed");
        }
    } catch (GeneralSecurityException | IOException e) {
        logger.error("Calendar service failure: {}", e.getMessage());
        throw new RuntimeException("Calendar service error", e);
    }
    return new ArrayList<>(reservedDates);
}

    /**
     * Fetches event start dates from a Google Calendar.
     * 
     * @param service    Authenticated Google Calendar client
     * @param calendarId ID of the calendar to query
     * @return List of dates in "yyyy-MM-dd" format
     */
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

    /**
     * Confirms a reservation by:
     * 1. Creating a Google Calendar event
     * 2. Updating the reservation with the Google event ID
     * 
     * @param reservationId ID of the reservation to confirm
     * @return Updated Reservation entity
     */
 
 public Reservation confirmReservation(ObjectId reservationId) {
    Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new RuntimeException("Reservation not found"));
    
    try {
        Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
            .orElseThrow(() -> new RuntimeException("Etablissement not found"));
        
        Event calendarEvent = createCalendarEvent(reservation);
        Event createdEvent = getCalendarService().events()
                .insert(etab.getGoogleCalendarId(), calendarEvent)
                .execute();
        
        reservation.setGoogleCalendarEventId(createdEvent.getId());
        return reservationRepository.save(reservation);
    } catch (Exception e) {
        logger.error("Reservation confirmation failed", e);
        throw new RuntimeException("Reservation confirmation error", e);
    }
}
 

    /**
     * Maps a Reservation to a Google Calendar event.
     * 
     * @param reservation Reservation to map
     * @return Google Calendar Event object
     */
    private Event createCalendarEvent(Reservation reservation) {
        return new Event()
                .setSummary(reservation.getIntituleAction()) // Event title
                .setDescription(reservation.getDescription()) // Event details
                .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut()))) // Start time
                .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin()))); // End time
    }

    /**
     * Cancels a reservation by:
     * 1. Deleting the Google Calendar event (if exists)
     * 2. Removing the reservation from the database
     * 
     * @param reservationId ID of the reservation to cancel
     */
 
 public void cancelReservation(ObjectId reservationId) {
    Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new RuntimeException("Reservation not found"));
    
    try {
        if (reservation.getGoogleCalendarEventId() != null) {
            Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Etablissement not found"));
                
            getCalendarService().events()
                    .delete(etab.getGoogleCalendarId(), reservation.getGoogleCalendarEventId())
                    .execute();
        }
        reservationRepository.delete(reservation);
    } catch (IOException | GeneralSecurityException e) {
        logger.error("Reservation cancellation failed", e);
        throw new RuntimeException("Cancellation error", e);
    }
}
 

    /**
     * Initializes the Google Calendar API client.
     * 
     * @return Authenticated Calendar service instance
     */
    private Calendar getCalendarService() throws GeneralSecurityException, IOException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        return new Calendar.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Reservation System")
                .build();
    }

    // -------------------- Repository Queries -------------------- //
    /** Returns reservations without a Google Calendar event ID */
    public List<Reservation> getUnconfirmedReservations() {
        return reservationRepository.findByGoogleCalendarEventIdNull();
    }

    /** Returns reservations with a Google Calendar event ID */
    public List<Reservation> getConfirmedReservations() {
        return reservationRepository.findByGoogleCalendarEventIdNotNull();
    }

    /** Returns reservations with status EN_ATTENTE (pending) */
    public List<Reservation> getPendingReservations() {
        return reservationRepository.findByStatut(StatusReservation.EN_ATTENTE);
    }

    /** Returns reservations with status ACCEPTÉE (accepted) */
    public List<Reservation> getAcceptedReservations() {
        return reservationRepository.findByStatut(StatusReservation.ACCEPTÉE);
    }

    // -------------------- Overloaded Methods -------------------- //
    /**
     * Confirms a reservation (String ID overload).
     * Validates the reservation is in a pending state before confirmation.
     */
 
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
        reservation.setGoogleCalendarEventId(createdEvent.getId());
        return reservationRepository.save(reservation);
    } catch (Exception e) {
        logger.error("Reservation confirmation failed", e);
        throw new RuntimeException("Reservation confirmation error", e);
    }
}

 

 

    /**
     * Cancels a reservation (String ID overload).
     * Marks the reservation as ANNULÉE (canceled) after deleting the Google event.
     */
   
   public void cancelReservation(String reservationId) {
    Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new RuntimeException("Reservation not found"));
    
    try {
        if (reservation.getGoogleCalendarEventId() != null) {
            // Get the establishment's calendar
            Etablissement etab = etablissementRepo.findById(reservation.getEtablissementId())
                .orElseThrow(() -> new RuntimeException("Etablissement not found"));
            
            getCalendarService().events()
                    .delete(etab.getGoogleCalendarId(), reservation.getGoogleCalendarEventId())
                    .execute();
        }
        reservation.setStatut(StatusReservation.ANNULÉE);
        reservationRepository.save(reservation);
    } catch (IOException | GeneralSecurityException e) {
        logger.error("Reservation cancellation failed", e);
        throw new RuntimeException("Cancellation error", e);
    }
}

    // -------------------- Time Slot Management -------------------- //
    /**
     * Generates 30-minute time slots for a given date in Tunis time zone.
     * 
     * @param date Date to generate slots for
     * @return List of CalendarSlotDTO objects with start/end times
     */
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

    /**
     * Returns time slots for a specific date.
     * 
     * @param dateString Date in "yyyy-MM-dd" format
     * @return List of CalendarSlotDTO or empty list on invalid format
     */
    public List<CalendarSlotDTO> getCalendarView(String dateString) {
        try {
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
            Date date = format.parse(dateString);
            return generateTimeSlots(date);
        } catch (ParseException e) {
            logger.error("Invalid date format: {}", dateString, e);
            return Collections.emptyList();
        }
    }

    // -------------------- Availability Check -------------------- //
    /**
     * Checks if a space (calendar) is available during a specified time range.
     * 
     * @param espaceId  Calendar ID representing the space
     * @param startDate Start of the time range
     * @param endDate   End of the time range
     * @return true if no overlapping events exist, false otherwise
     */
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

    public Calendar getGoogleCalendarClient() throws GeneralSecurityException, IOException {
        return getCalendarService();
    }

    // creates a new Google Calendar for an establishment.
    public String createCalendarForEtablissement(Etablissement etablissement)
            throws GeneralSecurityException, IOException {

        // 1. Initialize Google Calendar API client
        Calendar service = getCalendarService();

        // 2. Define calendar properties
        com.google.api.services.calendar.model.Calendar calendar = new com.google.api.services.calendar.model.Calendar();

        calendar.setSummary(etablissement.getNom() + " - Reservations");
        calendar.setTimeZone("Africa/Tunis");
        calendar.setDescription("Reservations for " + etablissement.getNom());

        // 3. Create the calendar
        com.google.api.services.calendar.model.Calendar createdCalendar = service.calendars().insert(calendar)
                .execute();

        // 4. Return the calendar ID (e.g., "abc123@group.calendar.google.com")
        return createdCalendar.getId();
    }
    public String getServiceAccountEmail() throws IOException {
    // Load the service account credentials from the JSON file
    GoogleCredentials credentials = GoogleCredentials.fromStream(
            calendarProperties.getServiceAccountKey().getInputStream())
            .createScoped(SCOPES);
    
    if (credentials instanceof ServiceAccountCredentials) {
        return ((ServiceAccountCredentials) credentials).getClientEmail();
    }
    throw new IllegalStateException("Expected service account credentials");
}

}