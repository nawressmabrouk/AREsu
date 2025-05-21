package tn.sousse.univ.reservation_app.models;

import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonFormat;    // ← import this
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

    @JsonFormat(
      shape     = JsonFormat.Shape.STRING,
      pattern   = "yyyy-MM-dd'T'HH:mm:ssXXX",
      timezone  = "Africa/Tunis"
    )
    private Date heureDebut;   // ← now parsed/written in Tunis time

    @JsonFormat(
      shape     = JsonFormat.Shape.STRING,
      pattern   = "yyyy-MM-dd'T'HH:mm:ssXXX",
      timezone  = "Africa/Tunis"
    )
    private Date heureFin;     // ← same here

    private StatusReservation statut;
    private String demandeurId;
    private String espaceId;
    private String responsableEspaceId;
    private Boolean vueParSecretaire = false;
    private String DecideePar;
    private List<String> equipements;
    private List<String> approvedEquipements;
    private String espaceNom;
    private String demandeurRole;
    private String etablissementId;
    private String annulationReason;

    @Field("google_event_id")
    private String googleEventId;
}
