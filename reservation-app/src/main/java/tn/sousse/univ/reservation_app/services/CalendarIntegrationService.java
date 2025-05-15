package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;

@Service
public class CalendarIntegrationService {

    private static final SimpleDateFormat DATE_FORMATTER = new SimpleDateFormat("yyyy-MM-dd");

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private GoogleCalendarService calendarService;

    @Value("${google.calendar.calendar-id}")
    private String calendarId;

    @Value("${google.calendar.timezone}")
    private String timeZone;

    public void confirmReservation(Reservation reservation) {
        // 1. Vérification du statut
        if (reservation.getStatut() != StatusReservation.EN_ATTENTE) {
            throw new IllegalStateException("La réservation n'est pas en état d'attente");
        }

        // 2. Vérification de la date
        if (reservation.getHeureDebut().before(new Date())) {
            throw new IllegalArgumentException("La date de réservation est déjà passée");
        }

        // 3. Création de l'événement Google Calendar
        try {
            // Récupérer le client Google Calendar
            Calendar calendarClient = calendarService.getGoogleCalendarClient();

            Event event = createCalendarEvent(reservation);
            Event createdEvent = calendarClient.events() // Utiliser le client directement
                    .insert(calendarId, event)
                    .execute();

            reservation.setGoogleCalendarEventId(createdEvent.getId());
            reservation.setStatut(StatusReservation.ACCEPTÉE);

        } catch (GeneralSecurityException | IOException e) {
            throw new RuntimeException("Erreur Google Calendar", e);
        }
    }

    private Event createCalendarEvent(Reservation reservation) {
        // 1. Validation de la date
        validerDates(reservation.getHeureDebut(), reservation.getHeureFin());

        // 2. Vérification des conflits
        verifierConflits(reservation);

        // 3. Création de l'événement Google Calendar
        try {
            DateTime startDateTime = new DateTime(reservation.getHeureDebut());
            DateTime endDateTime = new DateTime(reservation.getHeureFin());

            return new Event()
                    .setSummary("Réservation: " + reservation.getEspaceNom())
                    .setDescription(reservation.getDescription())
                    .setStart(new EventDateTime().setDateTime(startDateTime).setTimeZone(timeZone))
                    .setEnd(new EventDateTime().setDateTime(endDateTime).setTimeZone(timeZone));

        } catch (Exception e) {
            throw new RuntimeException("Erreur de formatage des dates pour Google Calendar", e);
        }
    }

    private void validerDates(Date heureDebut, Date heureFin) {
        // Validation 1: Date dans le futur
        Date maintenant = new Date();
        if (heureDebut.before(maintenant)) {
            throw new IllegalArgumentException("La date de réservation est déjà passée");
        }

        // Validation optionnelle: Heure de fin après heure de début
        if (heureFin.before(heureDebut)) {
            throw new IllegalArgumentException("L'heure de fin doit être après l'heure de début");
        }
    }

    private void verifierConflits(Reservation nouvelleReservation) {
        // Validation 2: Pas de conflit avec les réservations existantes
        List<Reservation> conflits = reservationRepository.findConflictingReservations(
                nouvelleReservation.getEspaceId(),
                StatusReservation.ACCEPTÉE,
                nouvelleReservation.getHeureDebut(),
                nouvelleReservation.getHeureFin());

        if (!conflits.isEmpty()) {
            String dateStr = DATE_FORMATTER.format(nouvelleReservation.getHeureDebut());
            throw new IllegalArgumentException("Le créneau horaire du " + dateStr + " est déjà réservé");
        }
    }
}
