package tn.sousse.univ.reservation_app.models;

import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Document(collection = "users")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor

public class User {

    @Id
    private String id;
    private String nom;
    private String prenom;
    private String email;
    private String numTel;
    private Role role;
    private String fonction;
    private String nomEtablissement;
    private String password;
    private String structure;
    private String linkedInLink;

    private boolean enabled = false;
    private boolean passwordChangeRequired;
    private boolean isPartenaire;

    private List<String> espacesResponsables;

}