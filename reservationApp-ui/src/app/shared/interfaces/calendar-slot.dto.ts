export interface CalendarSlotDTO {
    heureDebut: string | Date;
    heureFin: string | Date;
    reserved?: boolean;
    etablissementReserved?: boolean;
    intituleAction?: string;
    espaceName?: string;
    responsableAction?: string;
    usersReservation?: boolean;
  }