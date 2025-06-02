
import { StatusReservation } from '../../models/reservation.model';

export interface CalendarSlotDTO {
  id: string;
  heureDebut:  Date;
  heureFin:   Date;
  etablissementId: string;
  espaceId:       string;
  intituleAction?: string;
  description?:    string;
  
  espaceNom: string;
  statut: StatusReservation;
  reserved:   boolean;
  selectable: boolean;
}
