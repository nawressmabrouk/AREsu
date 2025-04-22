package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;

import tn.sousse.univ.reservation_app.dto.ReservationRequestDTO;
import tn.sousse.univ.reservation_app.dto.ReservationResponseDTO;
import tn.sousse.univ.reservation_app.mappers.ReservationMapper;
import tn.sousse.univ.reservation_app.models.Espace;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;

@Service
public class ReservationService {

    @Autowired
    private Calendar googleCalendar;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GoogleCalendarService googleCalendarService;

    @Autowired
    private EspaceRepository espaceRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SecretaireGeneraleService secretaireGeneraleService;

    private static final String CALENDAR_ID = "REDACTED_OLD_APP_EMAIL";

    public ReservationResponseDTO creerReservation(ReservationRequestDTO reservationDTO) {
        User demandeur = userRepository.findById(reservationDTO.getDemandeurId())
                .orElseThrow(() -> new RuntimeException(
                        "Demandeur introuvable avec ID: " + reservationDTO.getDemandeurId()));

        Reservation reservation = ReservationMapper.toEntity(reservationDTO, demandeur.getId());
        reservation.setStatut(StatusReservation.EN_ATTENTE);

        Reservation savedReservation = reservationRepository.save(reservation);

        return ReservationMapper.toResponseDTO(savedReservation, demandeur.getEmail(), demandeur.getNom());
    }

    public void addReservationToCalendar(Reservation reservation) throws IOException {
        Event event = new Event()
                .setSummary(reservation.getIntituleAction())
                .setDescription(reservation.getDescription())
                .setStart(new EventDateTime().setDateTime(new DateTime(reservation.getHeureDebut())))
                .setEnd(new EventDateTime().setDateTime(new DateTime(reservation.getHeureFin())));

        googleCalendar.events().insert(CALENDAR_ID, event).execute();
    }

    public void supprimerReservation(String id) {
        reservationRepository.deleteById(id);
    }

    public List<Reservation> trouverReservationsParStatut(String statut) {
        return reservationRepository.findByStatut(statut);
    }

    public List<Reservation> trouverReservationsParEspaceId(ObjectId espaceId) {
        return reservationRepository.findByEspaceId(espaceId);
    }

    public Reservation trouverReservationParId(String id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée avec ID: " + id));
    }

    public List<Reservation> trouverReservationsParDemandeurId(String demandeurId) {
        return reservationRepository.findByDemandeurId(demandeurId);
    }

    public void annulerReservation(String reservationId, Long demandeurId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée avec l'ID : " + reservationId));

        if (!reservation.getDemandeurId().equals(demandeurId)) {
            throw new RuntimeException("Vous n'avez pas le droit d'annuler cette réservation.");
        }

        if (reservation.getStatut() == StatusReservation.ANNULÉE) {
            throw new RuntimeException("Cette réservation est déjà annulée.");
        }

        reservation.setStatut(StatusReservation.ANNULÉE);
        reservationRepository.save(reservation);

        // Mise à jour dans Google Calendar
        if (reservation.getGoogleCalendarEventId() != null) {
            try {
                googleCalendarService.marquerEvenementCommeAnnule(reservation.getGoogleCalendarEventId(), reservation);
            } catch (Exception e) {
                throw new RuntimeException("Erreur lors de la mise à jour du calendrier: " + e.getMessage());
            }
        }
    }

    @Transactional
    public String transmettreReservation(String reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        String espaceId = reservation.getEspaceId();
        Optional<Espace> optionalEspace = espaceRepository.findById(espaceId);

        if (optionalEspace.isEmpty()) {
            return "ESPACE_NOT_FOUND";
        }

        Espace espace = optionalEspace.get();
        String responsableId = espace.getResponsableId();

        if (responsableId != null) {
            // Dispatch to Responsable
            reservation.setStatut(StatusReservation.ATTRIBUÉE);
            reservation.setResponsableEspaceId(responsableId);
            reservationRepository.save(reservation);

            notificationService.sendNotification(
                    responsableId,
                    "Nouvelle demande de réservation à examiner.",
                    reservationId);

            // Visa by SG
            // secretaireGeneraleService.viewReservation(reservation);

            return "ENVOYÉ_RESPONSABLE_ET_SG";
        } else {
            // SG handles it fully
            reservation.setStatut(StatusReservation.EN_ATTENTE);
            reservationRepository.save(reservation);

            secretaireGeneraleService.handleReservation(reservation);

            return "ENVOYÉ_SG_SEUL";
        }
    }

}
