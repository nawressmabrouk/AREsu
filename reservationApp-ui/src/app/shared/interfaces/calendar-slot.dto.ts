/*export interface CalendarSlotDTO {
  id: string;
  heureDebut: string | Date;  // Can be either string or Date
  heureFin: string | Date;    // Can be either string or Date
  reserved: boolean;
   date: string;
  // Add any other properties your API returns
  [key: string]: any; // For additional dynamic properties
}
*/

export interface CalendarSlotDTO {
  id: string;
  heureDebut: Date;
  heureFin: Date;
  espaceId: string;
  etablissementId: string;
  reserved: boolean;
  statut: 'confirmed' | 'pending';

  // ... other properties
}



