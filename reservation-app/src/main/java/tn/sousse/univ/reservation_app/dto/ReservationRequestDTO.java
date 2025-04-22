package tn.sousse.univ.reservation_app.dto;

import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReservationRequestDTO {
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
    private String demandeurId;
    private String espaceId;
    private List<String> equipements;

}
