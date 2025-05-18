package tn.sousse.univ.reservation_app.dto;

import java.util.Date;
import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReservationResponseDTO {
    private String id;
    private String demandeurEmail;
    private String demandeurNom;
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
    private String statut;
    private String responsableEspaceId;
    private String espaceId;
    private boolean VueParSecretaire;
    private String DecideePar;
    private String espaceNom;
    private List<String> equipements;
    private String demandeurRole ;
  private String etablissementId;
     private List<String> equipementsDemandes;
    private List<String> equipementsApprouves;

}
