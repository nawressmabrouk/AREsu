package tn.sousse.univ.reservation_app.models;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    private String id;
    private String intituleAction;
    private int nbrParticipant;
    private String responsableAction;
    private String emailR;
    private String numTelR;
    private String fonctionR;
    private String lienLinkedInR;
    private String cible;
    private String description;
    private Date heureDebut;
    private Date heureFin;
    private StatusReservation statut;
    private String demandeurId;
    private String espaceId;
    private String responsableEspaceId;
    private String googleCalendarEventId;
    private Boolean vueParSecretaire = false;
    private String DecideePar;
    private List<String> equipements;
    private List<String> approvedEquipements; // Approved equipment //
    private String espaceNom;       
    private String demandeurRole;

    private String annulationReason;

}