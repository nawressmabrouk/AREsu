

package tn.sousse.univ.reservation_app.services;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import tn.sousse.univ.reservation_app.models.Etablissement;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;
import tn.sousse.univ.reservation_app.models.User;
import tn.sousse.univ.reservation_app.repositories.EspaceRepository;
import tn.sousse.univ.reservation_app.repositories.ReservationRepository;
import tn.sousse.univ.reservation_app.repositories.UserRepository;
import tn.sousse.univ.reservation_app.repositories.EtablissementRepository;
@Service
public class ReservationService {
private static final Logger logger = LoggerFactory.getLogger(SecretaireGeneraleService.class);
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
    
    @Autowired
    private EtablissementRepository etablissementRepository;

     @Autowired
    private EmailService emailService;

    private static final String CALENDAR_ID = "REDACTED_OLD_APP_EMAIL";
/* 
public ReservationResponseDTO creerReservation(ReservationRequestDTO reservationDTO) {
    // Fetch demandeur
    User demandeur = userRepository.findById(reservationDTO.getDemandeurId())
            .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));

    // Fetch espace
    Espace espace = espaceRepository.findById(reservationDTO.getEspaceId())
            .orElseThrow(() -> new RuntimeException("Espace introuvable"));

    // Create reservation entity
    Reservation reservation = ReservationMapper.toEntity(reservationDTO, demandeur.getId());
    
    // Set espace name and demandeur role HERE
    reservation.setEspaceNom(espace.getNom());                // Add this line
    reservation.setDemandeurRole(demandeur.getRole().toString()); // Add this line
    
    reservation.setStatut(StatusReservation.EN_ATTENTE);
    Reservation savedReservation = reservationRepository.save(reservation); // Saved to DB

    // Build response
    return ReservationMapper.toResponseDTOFull(
            savedReservation,
            demandeur.getEmail(),
            demandeur.getNom(),
            espace.getNom(),
            demandeur.getRole().toString()
    );
}


*/


public ReservationResponseDTO creerReservation(ReservationRequestDTO reservationDTO) {
    logger.debug("Début de creerReservation avec DTO: {}", reservationDTO);

    // 1. Fetch demandeur
    User demandeur = userRepository.findById(reservationDTO.getDemandeurId())
            .orElseThrow(() -> new RuntimeException("Demandeur introuvable"));

    // 2. Fetch espace and verify etablissementId
    Espace espace = espaceRepository.findById(reservationDTO.getEspaceId())
            .orElseThrow(() -> new RuntimeException("Espace introuvable"));
    
    if (espace.getEtablissementId() == null || espace.getEtablissementId().isEmpty()) {
        logger.error("L'espace {} n'a pas d'etablissementId associé", espace.getId());
        throw new IllegalStateException("L'espace n'est associé à aucun établissement");
    }

    // 3. Create reservation with ALL required fields
    Reservation reservation = ReservationMapper.toEntity(reservationDTO, demandeur.getId());
    reservation.setEspaceNom(espace.getNom());
    reservation.setDemandeurRole(demandeur.getRole().toString());
    reservation.setStatut(StatusReservation.EN_ATTENTE);
    reservation.setEtablissementId(espace.getEtablissementId()); // CRITICAL: Set etablissementId
    
    // 4. Save reservation
    Reservation savedReservation = reservationRepository.save(reservation);
    logger.info("Réservation créée avec ID: {}", savedReservation.getId());

    // 5. Verify transmission data
    logger.debug("Transmission data - ReservationID: {}, EspaceID: {}, EtablissementID: {}", 
        savedReservation.getId(), 
        savedReservation.getEspaceId(), 
        savedReservation.getEtablissementId()
    );

    try {
        transmettreReservation(savedReservation.getId());
    } catch (Exception e) {
        logger.error("Échec transmission pour réservation {}", savedReservation.getId(), e);
        throw new RuntimeException("Erreur de transmission: " + e.getMessage(), e);
    }

    // ... (email sending code remains the same)

    return ReservationMapper.toResponseDTOFull(
            savedReservation,
            demandeur.getEmail(),
            demandeur.getNom(),
            espace.getNom(),
            demandeur.getRole().toString()
    );
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



    public void annulerReservation(String reservationId, String demandeurId) {
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

       
       
       
       
       
       
       
       
    }






//endpoint nourhen :
    
@Transactional
public String transmettreReservation(String reservationId) {
    Reservation reservation = reservationRepository.findById(reservationId)
        .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

    Espace espace = espaceRepository.findById(reservation.getEspaceId())
        .orElseThrow(() -> new RuntimeException("Espace non trouvé"));

    try {
        String recipientId = determineRecipient(espace.getId());
        Etablissement etablissement = etablissementRepository.findById(espace.getEtablissementId())
            .orElseThrow(() -> new RuntimeException("Etablissement non trouvé"));

        // Mise à jour du statut de vue
        reservation.setVueParSecretaire(false);
        reservationRepository.save(reservation);

        // Notification avec contexte complet
        notificationService.sendNotification(
            recipientId,
            "Nouvelle demande pour " + espace.getNom() + " (" + etablissement.getNom() + ")",
            reservationId
        );
     User destinataire = userRepository.findById(recipientId).orElseThrow();
    emailService.sendEmail(
        destinataire.getEmail(),
        "Nouvelle demande de réservation",
        "Une nouvelle demande nécessite votre action : " + reservation.getIntituleAction()
    );


            if(espace.getResponsableId() != null) {
                reservation.setStatut(StatusReservation.EN_ATTENTE);
                reservation.setResponsableEspaceId(espace.getResponsableId());
                 reservation.setVueParSecretaire(false); 
                reservationRepository.save(reservation);
                
                // Notify secretary general if needed
                User secretaire = userRepository.findById(etablissement.getSecretaireGeneraleId())
                    .orElseThrow(() -> new RuntimeException("Secrétaire général non trouvé"));
                
                emailService.sendEmail(
                    secretaire.getEmail(),
                    "Notification de demande",
                    "Une nouvelle demande a été transmise à un responsable : " + espace.getNom()
                );
                
                return "ENVOYÉ_RESPONSABLE_ET_SG";
            } else {
                reservation.setStatut(StatusReservation.EN_ATTENTE);
                reservationRepository.save(reservation);
                return "ENVOYÉ_SG_SEUL";
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Erreur de transmission: " + e.getMessage());
        }
    }




public String determineRecipient(String espaceId) {
    // 1. Récupération de l'espace
    Espace espace = espaceRepository.findById(espaceId)
        .orElseThrow(() -> new RuntimeException("Espace non trouvé"));
    
    // 2. Priorité au responsable d'espace
    if(espace.getResponsableId() != null && !espace.getResponsableId().isEmpty()) {
        return espace.getResponsableId();
    }
    
    // 3. Fallback au secrétaire d'établissement
    Etablissement etablissement = etablissementRepository.findById(espace.getEtablissementId())
        .orElseThrow(() -> new RuntimeException("Etablissement non trouvé"));
    
    if(etablissement.getSecretaireGeneraleId() == null) {
        throw new RuntimeException("Secrétaire général non configuré");
    }
    
    return etablissement.getSecretaireGeneraleId();
}

}

    
