package tn.sousse.univ.reservation_app.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.sousse.univ.reservation_app.models.Espace;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtablissementWithEspacesDTO {

    private String etablissementNom;
    private List<Espace> espaces;
    // base64 string
    private String logo; 
    
}
