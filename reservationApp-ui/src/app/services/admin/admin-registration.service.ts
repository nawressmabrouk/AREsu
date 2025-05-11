import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
interface Espace {
  id: string;
  nom: string;
  capacite: number;
  equipement: string[];
  responsableId: string; // Adapter selon le vrai nom de champ de l'API
  etablissementId: string;
  categorie: string;
  type: string;
}

export enum Role {
  ADMIN = 'ADMIN',
  SECRETAIRE_GENERALE = 'SECRETAIRE_GENERALE',
  RESPONSABLE_SALLE = 'RESPONSABLE_SALLE'
}

export interface AdminUser {
  id?: string;
  prenom: string;
  nom: string;
  email: string;
  numTel: string;
  role: Role;
  fonction: string;
  nomEtablissement: string;
  structure: string;
  linkedInLink?: string;
  espacesResponsables: string[];
}
@Injectable({
  providedIn: 'root'
})
export class AdminRegistrationService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  //la méthode registerAdmin 
registerAdmin(userData: AdminUser): Observable<AdminUser> {
    return this.http.post<AdminUser>(
      `${this.apiUrl}/addSousAdmins`,
      userData,
      { withCredentials: true }
    );
  }




updateAdmin(adminId: string, userData: AdminUser): Observable<AdminUser> {
  return this.http.put<AdminUser>(
    `${this.apiUrl}/update-sous-admins/${adminId}`,
    userData,
    { withCredentials: true }
  );
}

deleteAdmin(adminId: string): Observable<string> {
  return this.http.delete(
    `${this.apiUrl}/delete-sous-admins/${adminId}`,
    { 
      responseType: 'text',
      withCredentials: true
    }
  );
}
 
 

  getResponsables(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/responsables`, {
      withCredentials: true
    });
  }

  // Espaces
  ajouterEspace(responsableId: string, espaceData: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${responsableId}/ajouterEspace`, 
      espaceData, 
      { withCredentials: true }
    );
  }

  modifierEspace(espaceId: string, espaceData: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/modifierEspace/${espaceId}`, 
      espaceData, 
      { withCredentials: true }
    );
  }

  /*supprimerEspace(responsableId: string, espaceId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${responsableId}/supprimerEspace/${espaceId}`, 
      { 
        withCredentials: true,
        responseType: 'text'
      }
    );
  }*/

 supprimerEspace(responsableId: string, espaceId: string): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/${responsableId}/supprimerEspace/${espaceId}`,
    { 
      responseType: 'text', // <-- Ajouter ceci
      withCredentials: true
      
    }
  );
}

  // Méthodes utilitaires
  searchUsers(searchTerm: string): Observable<AdminUser[]> {
    const params = new HttpParams().set('search', searchTerm);
    return this.http.get<AdminUser[]>(`${this.apiUrl}/utilisateurs`, {
      params,
      withCredentials: true
    });
  }

  getUserDetails(userId: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(
      `${this.apiUrl}/utilisateurs/${userId}`, 
      { withCredentials: true }
    );
  }

  getAllEspaces(): Observable<Espace[]> {
  return this.http.get<Espace[]>(`${this.apiUrl}/espaces`, {
    withCredentials: true
  });
}
}