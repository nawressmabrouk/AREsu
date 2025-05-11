package tn.sousse.univ.reservation_app.mappers;
import tn.sousse.univ.reservation_app.dto.ReservationRequestDTO;
import tn.sousse.univ.reservation_app.dto.ReservationResponseDTO;
import tn.sousse.univ.reservation_app.models.Reservation;
import tn.sousse.univ.reservation_app.models.StatusReservation;

public class ReservationMapper {

    // Convert DTO to Entity (for saving reservation)
    public static Reservation toEntity(ReservationRequestDTO dto, String string) {
        Reservation reservation = new Reservation();
        reservation.setDemandeurId(dto.getDemandeurId()); // Ensure demandeurId is set
        reservation.setIntituleAction(dto.getIntituleAction());
        reservation.setNbrParticipant(dto.getNbrParticipant());
        reservation.setResponsableAction(dto.getResponsableAction());
        reservation.setNumTelR(dto.getNumTelR());
        reservation.setEmailR(dto.getEmailR());
        reservation.setFonctionR(dto.getFonctionR());
        reservation.setLienLinkedInR(dto.getLienLinkedInR());
        reservation.setCible(dto.getCible());
        reservation.setDescription(dto.getDescription());
        reservation.setHeureDebut(dto.getHeureDebut());
        reservation.setHeureFin(dto.getHeureFin());
        reservation.setStatut(StatusReservation.EN_ATTENTE); // Default status
        reservation.setEspaceId(dto.getEspaceId());
        reservation.setEquipements(dto.getEquipements());
        return reservation;
    }

    // Convert Entity to Response DTO (for sending reservation data)
    public static ReservationResponseDTO toResponseDTO(Reservation entity, String demandeurEmail, String demandeurNom) {
        ReservationResponseDTO dto = new ReservationResponseDTO();
        dto.setId(entity.getId());
        dto.setDemandeurEmail(demandeurEmail);
        dto.setDemandeurNom(demandeurNom);
        dto.setIntituleAction(entity.getIntituleAction());
        dto.setNbrParticipant(entity.getNbrParticipant());
        dto.setResponsableAction(entity.getResponsableAction());
        dto.setNumTelR(entity.getNumTelR());
        dto.setEmailR(entity.getEmailR());
        dto.setFonctionR(entity.getFonctionR());
        dto.setLienLinkedInR(entity.getLienLinkedInR());
        dto.setCible(entity.getCible());
        dto.setDescription(entity.getDescription());
        dto.setHeureDebut(entity.getHeureDebut());
        dto.setHeureFin(entity.getHeureFin());
        dto.setStatut(entity.getStatut().name()); // Convert enum to String
        dto.setResponsableEspaceId(entity.getResponsableEspaceId()); // Assuming this field
        dto.setEspaceId(entity.getEspaceId());
        dto.setEquipements(entity.getEquipements());

        return dto;
    }

public static ReservationResponseDTO toResponseDTOFull(
        Reservation entity,
        String demandeurEmail,
        String demandeurNom,
        String espaceNom,
        String demandeurRole) { // Add demandeurRole parameter
    ReservationResponseDTO dto = toResponseDTO(entity, demandeurEmail, demandeurNom);
    dto.setEspaceNom(espaceNom);
    dto.setDemandeurRole(demandeurRole); // Set demandeur role
    return dto;
}

}
