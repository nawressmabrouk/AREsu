// src/app/shared/interfaces/calendar-slot.dto.ts

import { StatusReservation } from '../../models/reservation.model';

export interface CalendarSlotDTO {
  id: string;
  heureDebut:  Date;
  heureFin:   Date;
  etablissementId: string;
  espaceId:       string;
  intituleAction?: string;
  description?:    string;
  
  espaceName: string;
  // <— instead of `"ACCEPTÉE" | "EN_ATTENTE" | "ANNULÉE"`
  statut: StatusReservation;

  // your extra UI flags
  reserved:   boolean;
  selectable: boolean;
}
