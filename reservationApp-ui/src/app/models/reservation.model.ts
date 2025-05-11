// src/app/models/reservation.model.ts

export interface Reservation {
    id: string;
    intituleAction: string;
    nbrParticipant: number;
    responsableAction: string;
    emailR: string;
    numTelR: string;
    fonctionR: string;
    lienLinkedInR: string;
    cible: string;
    description: string;
    heureDebut: Date;
    heureFin: Date;
    statut: StatusReservation;
    demandeurId: string;
    espaceId: string;
    responsableEspaceId: string;
    googleCalendarEventId?: string;
    vueParSecretaire?: boolean;
    DecideePar?: string;
    equipements: string[];
    espaceNom: string;         
    demandeurRole: string;      
    annulationReason: String; // Stores why a reservation was canceled
  }
  
  export enum StatusReservation {
    EN_ATTENTE = 'EN_ATTENTE',
    ACCEPTEE = 'ACCEPTEE', 
    REFUSEE = 'REFUSEE',   
    ATTRIBUEE = 'ATTRIBUEE',
    TERMINEE = 'TERMINEE',
    ANNULEE = 'ANNULEE' ,
  
  }
