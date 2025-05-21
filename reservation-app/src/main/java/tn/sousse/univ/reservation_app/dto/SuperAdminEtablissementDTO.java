package tn.sousse.univ.reservation_app.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;
import tn.sousse.univ.reservation_app.models.TypeEtablissement;
import tn.sousse.univ.reservation_app.models.Zone;

@Getter
@Setter
public class SuperAdminEtablissementDTO {
    private String id;
    private String nom;
    private String adresse;
    private Zone zone;
    private TypeEtablissement type;
    private String logo;

    private UserDTO secretaireGeneral;
    private List<UserDTO> responsables;
    private List<EspaceDTO> espaces;
}