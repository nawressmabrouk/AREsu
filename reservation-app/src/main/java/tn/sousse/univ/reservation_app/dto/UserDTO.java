package tn.sousse.univ.reservation_app.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

    private String id;
    private String nom;
    private String prenom;
    private String email;
    private String numTel;
    private String fonction;
    private String role;
    private String nomEtablissement;
    private String password;
    private String structure;
    private String linkedInLink;

}
