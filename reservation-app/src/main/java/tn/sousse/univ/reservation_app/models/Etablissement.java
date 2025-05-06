package tn.sousse.univ.reservation_app.models;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "etablissements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Etablissement {
    @Id
    private String id;
    private String nom;
    private String adresse;
    private Zone zone; // CHOTT_MERIEM SAHLOUL_HAMMAM_SOUSSE CENTRE_VILLE_CITE_RIADH
    private TypeEtablissement type; // INSTITUT ECOLE FACULTE

    private String secretaireGeneraleId;
    private String logo; // base64 string

    @Transient
    private List<Espace> espaces;

}
