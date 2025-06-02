import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Espace {
  id: string;
  nom: string;
  capacite: number;
  disponibilite: boolean;
  equipement: string[];
  responsableId: string;
  responsableNom: string | null;
  etablissementId: string;
  etablissementNom: string;
  categorie: string;
  type: string;
  googleCalendarId?: string;
  equipementsDisponibles?: { [key: string]: boolean };
}


export enum Role {
  ADMIN = 'ADMIN',
  SECRETAIRE_GENERALE = 'SECRETAIRE_GENERALE',
  RESPONSABLE_SALLE = 'RESPONSABLE_SALLE',
  DEMANDEUR = 'DEMANDEUR'
}

export interface AdminUser {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  numTel: string;
  role: Role;
  fonction: string;
  nomEtablissement: string;
  etablissementId?: string;
  structure: string;
  linkedInLink?: string;
   espacesResponsables: string[] | string;
  enabled?: boolean;
  passwordChangeRequired?: boolean;
  partenaire?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminRegistrationService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  
  //Register a new RESPONSABLE_SALLE (only) in the admin's establishment
  registerAdmin(userData: AdminUser): Observable<AdminUser> {
    // Ensure the role is RESPONSABLE_SALLE (enforced by backend too)
    userData.role = Role.RESPONSABLE_SALLE;
    
    return this.http.post<AdminUser>(
      `${this.apiUrl}/addSousAdmins`, 
      userData,
      { withCredentials: true }
    );
  }

  
  //Update an existing sous-admin ( belongs to same establishment)
  updateAdmin(adminId: string, userData: AdminUser): Observable<AdminUser> {
    return this.http.put<AdminUser>(
      `${this.apiUrl}/update-sous-admins/${adminId}`,
      userData,
      { withCredentials: true }
    );
  }

  
   // Delete a sous-admin 
  deleteAdmin(adminId: string): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/delete-sous-admins/${adminId}`,
      { 
        responseType: 'text',
        withCredentials: true
      }
    );
  }
  
  // Get all RESPONSABLE_SALLE users in current admin's establishment
  getResponsables(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/responsables`, {
      withCredentials: true
    });
  }

  
  // Add a new space to the admin's establishment
  ajouterEspace(responsableId: string, espaceData: Espace): Observable<Espace> {
    return this.http.post<Espace>(
      `${this.apiUrl}/ajouterEspace/${responsableId}`, 
      espaceData, 
      { withCredentials: true }
    );
  }


 // Update an existing space (must belong to admin's establishment)
  modifierEspace(espaceId: string, espaceData: Espace): Observable<Espace> {
    return this.http.put<Espace>(
      `${this.apiUrl}/modifierEspace/${espaceId}`, 
      espaceData, 
      { withCredentials: true }
    );
  }

  
   // Delete a space (must belong to admin's establishment)
  supprimerEspace(espaceId: string): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/supprimerEspace/${espaceId}`,
      { 
        responseType: 'text',
        withCredentials: true
      }
    );
  }


   // Get all spaces in current admin's establishment
  getAllEspaces(): Observable<Espace[]> {
    return this.http.get<Espace[]>(`${this.apiUrl}/espaces`, {
      withCredentials: true
    });
  }

}