package tn.sousse.univ.reservation_app.dto;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DecisionDTO {
     private boolean accepted;
    private List<String> approvedEquipments;
}
