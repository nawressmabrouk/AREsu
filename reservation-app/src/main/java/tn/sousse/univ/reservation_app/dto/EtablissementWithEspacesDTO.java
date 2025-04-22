package tn.sousse.univ.reservation_app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.sousse.univ.reservation_app.models.Espace;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtablissementWithEspacesDTO {
    private String etablissementNom;
    private List<Espace> espaces;
}
