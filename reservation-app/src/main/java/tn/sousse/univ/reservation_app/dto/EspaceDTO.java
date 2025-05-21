package tn.sousse.univ.reservation_app.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EspaceDTO {
    private String id;
    private String nom;
    private int capacite;
    private List<String> equipement;
    private String categorie;
    private String type;
    private UserDTO responsable;
}