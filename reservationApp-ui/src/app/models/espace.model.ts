export interface Espace {
  id: string;
  nom: string;
  disponibilite: boolean;
  capacite: number;
  equipement: string[];
  type: string;
  categorie: string;
  responsableId: string;
  responsableNom?: string;
  reservationsId?: string[];
  etablissementId?: string;
  etablissementNom?: string;
  googleCalendarId?: string;
  equipementsDisponibles?: { [key: string]: boolean };
}