package tn.sousse.univ.reservation_app.dto;

import java.util.Date;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.sousse.univ.reservation_app.models.StatusReservation;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CalendarSlotDTO {
    private Date heureFin;
    private Date heureDebut;
    private String etablissementId;
    private String espaceId;
    private String intituleAction;
    private String espaceName;
    private StatusReservation statut;
    private boolean reserved;
    private boolean usersReservation;
    private boolean selectable;
    private boolean etablissementReserved;
}