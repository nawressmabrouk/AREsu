package tn.sousse.univ.reservation_app.dto;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CalendarSlotDTO {
    private Date heureFin;
    private Date heureDebut;
    private boolean reserved;
    private boolean usersReservation;
    private boolean selectable;
    private boolean etablissementReserved;
    // Only populated for privileged roles
    private String intituleAction;
    private String espaceName;
    private String responsableAction;
}