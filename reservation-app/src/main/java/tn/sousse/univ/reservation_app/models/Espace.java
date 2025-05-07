package tn.sousse.univ.reservation_app.models;

import java.util.List;

import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Document(collection = "espaces")
public class Espace {

    @Id
    private String id;

    private String nom;
    private boolean disponibilite;
    private int capacite;
    private List<String> equipement;
    private String type;
    private String categorie;

    private String responsableId;
    private String responsableNom; 
    
    private List<ObjectId> reservationsId;

    private String etablissementId;
    private String etablissementNom;

    private String googleCalendarId;
    
}
