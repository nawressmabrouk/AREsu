/*package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.Events;

import tn.sousse.univ.reservation_app.dto.CalendarSlotDTO;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.Role;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;

@Service
public class GoogleCalendarService {
    private static final Logger log = LoggerFactory.getLogger(GoogleCalendarService.class);
    private static final ZoneId TUNIS_ZONE = ZoneId.of("Africa/Tunis");
    private static final String CALENDAR_ID = "REDACTED_OLD_APP_EMAIL";
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("yyyy-MM-dd");
    private static final SimpleDateFormat TIME_FORMAT = new SimpleDateFormat("HH:mm");

    @Autowired
    private com.google.api.services.calendar.Calendar googleCalendar;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private HolidayService holidayService;

    @Autowired
    private EspaceRepository espaceRepository;

    // Helper method to parse date strings
    private Date parseDate(String dateString) throws ParseException {
        return DATE_FORMAT.parse(dateString);
    }

    // Helper method to create Java Calendar instance
    private java.util.Calendar createCalendarInstance() {
        return java.util.Calendar.getInstance();
    }

    public List<String> getUnavailableSlots(Date date) throws IOException {
        Date startOfDay = getStartOfDay(date);
        Date endOfDay = getEndOfDay(date);

        Events events = googleCalendar.events().list(CALENDAR_ID)
                .setTimeMin(new DateTime(startOfDay))
                .setTimeMax(new DateTime(endOfDay))
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

        return events.getItems().stream()
                .map(event -> event.getStart().getDateTime() != null ? event.getStart().getDateTime().toStringRfc3339()
                        : event.getStart().getDate().toStringRfc3339())
                .collect(Collectors.toList());
    }

    public boolean isEspaceDisponible(ObjectId espaceId, Date startDate, Date endDate) throws IOException {
        String calendarId = espaceId.toString();
        Events events = googleCalendar.events().list(calendarId)
                .setTimeMin(new DateTime(startDate))
                .setTimeMax(new DateTime(endDate))
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        return events.getItems().isEmpty();
    }

    private Date getStartOfDay(Date date) {
        return Date.from(date.toInstant().atZone(TUNIS_ZONE).toLocalDate()
                .atStartOfDay(TUNIS_ZONE).toInstant());
    }

    private Date getEndOfDay(Date date) {
        return Date.from(date.toInstant().atZone(TUNIS_ZONE).toLocalDate()
                .atTime(23, 59, 59).atZone(TUNIS_ZONE).toInstant());
    }

    public void marquerEvenementCommeAnnule(String eventId, Reservation reservation) {
        try {
            Event event = googleCalendar.events().get("primary", eventId).execute();
            event.setSummary("[ANNULÉ] " + event.getSummary());
            event.setDescription((event.getDescription() != null ? event.getDescription() : "") +
                    "\nAnnulé par: " + reservation.getResponsableAction());
            event.setColorId("11");
            googleCalendar.events().update("primary", eventId, event).execute();
        } catch (Exception e) {
            log.error("Failed to cancel event", e);
            throw new RuntimeException("Failed to cancel event: " + e.getMessage());
        }
    }

    public void deleteEvent(String eventId) throws IOException {
        googleCalendar.events().delete(CALENDAR_ID, eventId).execute();
    }

    private boolean isSlotReserved(Reservation reservation, CalendarSlotDTO slot) {
        return !reservation.getHeureFin().before(slot.getHeureDebut()) &&
                !reservation.getHeureDebut().after(slot.getHeureFin());
    }

    private List<CalendarSlotDTO> generateTimeSlots(Date date) {
        List<CalendarSlotDTO> slots = new ArrayList<>();
        LocalDate localDate = date.toInstant().atZone(TUNIS_ZONE).toLocalDate();
        LocalTime startTime = LocalTime.of(8, 0);
        LocalTime endTime = LocalTime.of(18, 0);

        while (startTime.isBefore(endTime)) {
            CalendarSlotDTO slot = new CalendarSlotDTO();
            slot.setHeureDebut(Date.from(localDate.atTime(startTime).atZone(TUNIS_ZONE).toInstant()));
            slot.setHeureFin(Date.from(localDate.atTime(startTime.plusMinutes(30)).atZone(TUNIS_ZONE).toInstant()));
            slots.add(slot);
            startTime = startTime.plusMinutes(30);
        }
        return slots;
    }

    public boolean checkSlotAvailability(String date, String espaceId) {
        try {
            Date requestedDate = parseDate(date);
            java.util.Calendar requestedSlot = createCalendarInstance();
            requestedSlot.setTime(requestedDate);

            Criteria criteria = Criteria.where("espaceId").is(new ObjectId(espaceId))
                    .and("statut").ne(StatusReservation.REFUSÉE)
                    .and("heureDebut").lt(requestedSlot.getTime())
                    .and("heureFin").gt(requestedSlot.getTime());

            return !mongoTemplate.exists(Query.query(criteria), Reservation.class);
        } catch (Exception e) {
            log.error("Error checking slot availability", e);
            return false;
        }
    }

    public List<String> getUnavailableSlotsForSpace(String espaceId, String date) {
        try {
            Date requestedDate = parseDate(date);
            List<Reservation> reservations = getReservationsForDate(new ObjectId(espaceId), requestedDate);

            Set<String> unavailableSlots = new HashSet<>();
            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm");

            for (Reservation res : reservations) {
                Date start = res.getHeureDebut();
                Date end = res.getHeureFin();

                // Convert to LocalTime for easier hour/minute manipulation
                LocalTime startTime = start.toInstant().atZone(TUNIS_ZONE).toLocalTime();
                LocalTime endTime = end.toInstant().atZone(TUNIS_ZONE).toLocalTime();

                // Generate slots in 30-minute intervals
                LocalTime current = startTime;
                while (current.isBefore(endTime)) {
                    unavailableSlots.add(String.format("%02d:%02d", current.getHour(), current.getMinute()));
                    current = current.plusMinutes(30);
                }
            }

            return new ArrayList<>(unavailableSlots).stream()
                    .sorted()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting unavailable slots", e);
            return Collections.emptyList();
        }
    }

    public List<String> getUnavailableSlotsForEtablissement(String etablissementId, String date) {
        try {
            Date requestedDate = parseDate(date);
            List<Espace> espaces = espaceRepository.findByEtablissementId(etablissementId);
            Set<String> allUnavailableSlots = new HashSet<>();

            // Check if establishment is fully reserved
            if (isEtablissementReservedForDate(new ObjectId(etablissementId), requestedDate)) {
                // Return all time slots as unavailable
                return generateTimeSlots(requestedDate).stream()
                        .map(slot -> TIME_FORMAT.format(slot.getHeureDebut()))
                        .collect(Collectors.toList());
            }

            // Otherwise check individual spaces
            for (Espace espace : espaces) {
                allUnavailableSlots.addAll(getUnavailableSlotsForSpace(espace.getId(), date));
            }

            return new ArrayList<>(allUnavailableSlots).stream()
                    .sorted()
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting etablissement unavailable slots", e);
            return Collections.emptyList();
        }
    }

    private Optional<Reservation> findReservationForSlot(List<Reservation> reservations, CalendarSlotDTO slot) {
        return reservations.stream()
                .filter(res -> !res.getHeureFin().before(slot.getHeureDebut()) &&
                        !res.getHeureDebut().after(slot.getHeureFin()))
                .findFirst();
    }

    private Map<String, String> getEspaceNamesForReservations(List<Reservation> reservations) {
        Set<String> espaceIds = reservations.stream()
                .map(Reservation::getEspaceId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (espaceIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Espace> espaces = espaceRepository.findAllById(espaceIds);

        return espaces.stream()
                .collect(Collectors.toMap(
                        Espace::getId,
                        Espace::getNom,
                        (existing, replacement) -> existing));
    }

    public List<CalendarSlotDTO> getCalendarView(ObjectId etablissementId, ObjectId espaceId, String date,
            Role userRole, String userId) {
        try {
            Date requestedDate = parseDate(date);
            boolean isDemandeur = userRole == Role.DEMANDEUR_INTERNE || userRole == Role.DEMANDEUR_EXTERNE;

            // Get all accepted reservations for the establishment on this date
            boolean etablissementReserved = isEtablissementReservedForDate(etablissementId, requestedDate);

            // Get reservations for the specific space
            List<Reservation> reservations = getReservationsForDate(espaceId, requestedDate);
            Map<String, String> espaceNames = getEspaceNamesForReservations(reservations);

            // Generate time slots (8:00-18:00 in 30-minute intervals)
            List<CalendarSlotDTO> slots = generateTimeSlots(requestedDate);

            return slots.stream()
                    .map(slot -> {
                        // First check if establishment is fully reserved
                        if (etablissementReserved) {
                            slot.setReserved(true);
                            slot.setEtablissementReserved(true);
                            return slot;
                        }

                        // Check if slot is reserved
                        Optional<Reservation> reservation = findReservationForSlot(reservations, slot);

                        // For demandeurs, show all reservations as unavailable except their own
                        if (isDemandeur) {
                            if (reservation.isPresent()) {
                                Reservation res = reservation.get();
                                // If this is the demandeur's own reservation, mark it differently
                                if (res.getDemandeurId().equals(userId)) {
                                    slot.setReserved(false);
                                    slot.setUsersReservation(true);
                                    slot.setIntituleAction(res.getIntituleAction());
                                } else {
                                    slot.setReserved(true);
                                }
                            }
                        }
                        // For other roles (secretary, room manager), show full details
                        else {
                            slot.setReserved(reservation.isPresent());
                            if (reservation.isPresent()) {
                                Reservation res = reservation.get();
                                slot.setIntituleAction(res.getIntituleAction());
                                slot.setEspaceName(espaceNames.getOrDefault(res.getEspaceId(), "Unknown Espace"));
                                slot.setResponsableAction(res.getResponsableAction());
                            }
                        }

                        return slot;
                    })
                    .collect(Collectors.toList());
        } catch (ParseException e) {
            log.error("Invalid date format", e);
            return Collections.emptyList();
        }
    }

    private boolean isEtablissementReservedForDate(ObjectId etablissementId, Date date) {
        Date startOfDay = getStartOfDay(date);
        Date endOfDay = getEndOfDay(date);

        Criteria criteria = Criteria.where("etablissementId").is(etablissementId)
                .and("statut").is(StatusReservation.ACCEPTÉE)
                .and("heureDebut").lte(startOfDay) // Starts before or at start of day
                .and("heureFin").gte(endOfDay); // Ends after or at end of day

        return mongoTemplate.exists(Query.query(criteria), Reservation.class);
    }

    private List<Reservation> getReservationsForDate(ObjectId espaceId, Date date) {
        Date startOfDay = getStartOfDay(date);
        Date endOfDay = getEndOfDay(date);

        Criteria criteria = Criteria.where("espaceId").is(espaceId)
                .and("statut").ne(StatusReservation.REFUSÉE) // Include all non-refused reservations
                .and("heureDebut").gte(startOfDay)
                .and("heureFin").lte(endOfDay);

        return mongoTemplate.find(Query.query(criteria)
                .with(Sort.by(Sort.Direction.ASC, "heureDebut")),
                Reservation.class);
    }

}*/

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
import org.springframework.data.mongodb.core.query.Criteria;
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

import tn.sousse.univ.reservation_app.config.GoogleCalendarConfig;
import tn.sousse.univ.reservation_app.dto.CalendarSlotDTO;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;

@Service
public class GoogleCalendarService {
    private static final Logger logger = LoggerFactory.getLogger(GoogleCalendarService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final List<String> SCOPES = Collections.singletonList("https://www.googleapis.com/auth/calendar");
    private static final String[] TUNISIAN_HOLIDAY_CALENDAR_IDS = {
            "en.tunisia#holiday@group.v.calendar.google.com",
            "tunisian.official#holiday@group.v.calendar.google.com",
            "ar.tn#holiday@group.v.calendar.google.com",
            "en.tn#holiday@group.v.calendar.google.com"
    };

    private final GoogleCalendarConfig calendarProperties;
    private final ReservationRepository reservationRepository;
    private final GoogleCredentials credentials;
    private static final ZoneId TUNIS_ZONE = ZoneId.of("Africa/Tunis");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
private MongoTemplate mongoTemplate;

    public GoogleCalendarService(
            GoogleCalendarConfig calendarProperties,
            ReservationRepository reservationRepository) throws IOException {

        this.calendarProperties = calendarProperties;
        this.reservationRepository = reservationRepository;

        try {
            // Get the resource from configuration properties
            this.credentials = GoogleCredentials.fromStream(
                    calendarProperties.getServiceAccountKey().getInputStream())
                    .createScoped(SCOPES);
        } catch (IOException e) {
            logger.error("Failed to initialize Google Calendar credentials", e);
            throw new RuntimeException("Failed to initialize Google Calendar credentials", e);
        }
    }
    
  public List<String> getReservedDates() {
    Query query = new Query();
    query.addCriteria(Criteria.where("statut").is("ACCEPTEE")); // Filter by status
    
    List<Reservation> reservations = mongoTemplate.find(query, Reservation.class, "reservations");
    
    List<String> dates = new ArrayList<>();
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
    
    for (Reservation reservation : reservations) {
        try {
            // Extract start and end dates from the reservation
            Date startDateTime = reservation.getHeureDebut();
            Date endDateTime = reservation.getHeureFin();
            
            // Convert to LocalDate to handle date ranges
            LocalDate startDate = startDateTime.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            LocalDate endDate = endDateTime.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            
            // Add all dates in the range (start to end, inclusive)
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                dates.add(date.format(DateTimeFormatter.ISO_DATE)); // Format as "yyyy-MM-dd"
            }
        } catch (Exception e) {
            // Handle date parsing errors
            e.printStackTrace();
        }
    }
    
    return dates;
}
  
  
  
  
  

    private List<String> getReservationsFromCalendar(Calendar service, String calendarId) throws IOException {
        List<String> dates = new ArrayList<>();
        Events events = service.events().list(calendarId)
                .setTimeMin(new DateTime(System.currentTimeMillis()))
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        for (Event event : events.getItems()) {
            DateTime start = event.getStart().getDateTime();
            if (start == null) {
                start = event.getStart().getDate();
            }
            if (start != null) {
                // Convert to local date string
                dates.add(new java.util.Date(start.getValue()).toString().substring(0, 10));
            }
        }
        return dates;
    }

    public Reservation confirmReservation(ObjectId reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        try {
            Event calendarEvent = createCalendarEvent(reservation);
            Event createdEvent = getCalendarService().events()
                    .insert(calendarProperties.getCalendarId(), calendarEvent)
                    .execute();

            reservation.setGoogleCalendarEventId(createdEvent.getId());
            return reservationRepository.save(reservation);

        } catch (Exception e) {
            logger.error("Reservation confirmation failed", e);
            throw new RuntimeException("Reservation confirmation error", e);
        }
    }

    private Event createCalendarEvent(Reservation reservation) {
        return new Event()
                .setSummary(reservation.getIntituleAction())
                .setDescription(reservation.getDescription())
                .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut())))
                .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin())));
    }

    public void cancelReservation(ObjectId reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        try {
            if (reservation.getGoogleCalendarEventId() != null) {
                getCalendarService().events()
                        .delete(calendarProperties.getCalendarId(), reservation.getGoogleCalendarEventId())
                        .execute();
            }
            reservationRepository.delete(reservation);
        } catch (IOException | GeneralSecurityException e) {
            logger.error("Reservation cancellation failed", e);
            throw new RuntimeException("Cancellation error", e);
        }
    }

    private Calendar getCalendarService() throws GeneralSecurityException, IOException {
        NetHttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        return new Calendar.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("Reservation System")
                .build();
    }

    public List<Reservation> getUnconfirmedReservations() {
        return reservationRepository.findByGoogleCalendarEventIdNull();
    }

    public List<Reservation> getConfirmedReservations() {
        return reservationRepository.findByGoogleCalendarEventIdNotNull();
    }

    public List<Reservation> getPendingReservations() {
        return reservationRepository.findByStatut(StatusReservation.EN_ATTENTE);
    }

    public List<Reservation> getAcceptedReservations() {
        return reservationRepository.findByStatut(StatusReservation.ACCEPTÉE);
    }

    public Reservation confirmReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
            throw new IllegalStateException("Reservation is not in pending state");
        }

        try {
            // Create Google Calendar Event
            Event calendarEvent = new Event()
                    .setSummary(reservation.getIntituleAction())
                    .setDescription(reservation.getDescription())
                    .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut())))
                    .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin())));

            Event createdEvent = getCalendarService().events()
                    .insert(calendarProperties.getCalendarId(), calendarEvent)
                    .execute();

            // Update reservation status and Google Event ID
            reservation.setStatut(StatusReservation.ACCEPTÉE);
            reservation.setGoogleCalendarEventId(createdEvent.getId());

            return reservationRepository.save(reservation);

        } catch (Exception e) {
            logger.error("Reservation confirmation failed", e);
            throw new RuntimeException("Reservation confirmation error", e);
        }
    }

    public void cancelReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        try {
            if (reservation.getGoogleCalendarEventId() != null) {
                getCalendarService().events()
                        .delete(calendarProperties.getCalendarId(), reservation.getGoogleCalendarEventId())
                        .execute();
            }
            reservation.setStatut(StatusReservation.ANNULÉE);
            reservationRepository.save(reservation);

        } catch (IOException | GeneralSecurityException e) {
            logger.error("Reservation cancellation failed", e);
            throw new RuntimeException("Cancellation error", e);
        }
    }

    // Generate time slots with Date types but Tunis time zone awareness
    private List<CalendarSlotDTO> generateTimeSlots(Date date) {
        List<CalendarSlotDTO> slots = new ArrayList<>();
        ZonedDateTime zonedDate = date.toInstant().atZone(TUNIS_ZONE);
        LocalDate localDate = zonedDate.toLocalDate();

        LocalTime startTime = LocalTime.of(8, 0);
        LocalTime endTime = LocalTime.of(18, 0);

        while (startTime.isBefore(endTime)) {
            CalendarSlotDTO slot = new CalendarSlotDTO();

            // Convert to Tunis time zone Dates
            ZonedDateTime startZdt = ZonedDateTime.of(localDate, startTime, TUNIS_ZONE);
            ZonedDateTime endZdt = startZdt.plusMinutes(30);

            slot.setHeureDebut(Date.from(startZdt.toInstant()));
            slot.setHeureFin(Date.from(endZdt.toInstant()));

            // Default values for unused fields
            slot.setReserved(false);
            slot.setSelectable(true);
            slot.setUsersReservation(false);
            slot.setEtablissementReserved(false);

            slots.add(slot);
            startTime = startTime.plusMinutes(30);
        }
        return slots;
    }

    // Simplified calendar view that only returns time slots
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
    
public boolean isEspaceDisponible(ObjectId espaceId, Date startDate, Date endDate) throws IOException {
    try {
        String calendarId = espaceId.toString();
        Calendar service = getCalendarService();
        Events events = service.events().list(calendarId)
                .setTimeMin(new DateTime(startDate))
                .setTimeMax(new DateTime(endDate))
                .setSingleEvents(true)
                .setOrderBy("startTime")
                .execute();

        return events.getItems().isEmpty();
    } catch (GeneralSecurityException e) {
        logger.error("Security exception while checking space availability", e);
        throw new IOException("Failed to check space availability", e);
    }
}
































































































































    
}
