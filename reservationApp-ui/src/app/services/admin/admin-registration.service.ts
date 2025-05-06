import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminRegistrationService {
  private apiUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  registerAdmin(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addSousAdmins`, userData , {
      withCredentials: true // Important pour les cookies de session
    });
  }


    // Nouvelles méthodes pour les espaces
    ajouterEspace(responsableId: string, espaceData: any): Observable<any> {
      return this.http.post(
        `${this.apiUrl}/${responsableId}/ajouterEspace`, 
        espaceData, 
        { withCredentials: true }
      );
    }
    
    modifierEspace(espaceId: string, espaceData: any): Observable<any> {
      return this.http.put(`${this.apiUrl}/modifierEspace/${espaceId}`, espaceData, {
        withCredentials: true
      });
    }

    supprimerEspace(responsableId: string, espaceId: string): Observable<any> {
      return this.http.delete(
        `${this.apiUrl}/${responsableId}/supprimerEspace/${espaceId}`, 
        { withCredentials: true , 
          responseType: 'text' // Add this line
        }
      );
    }
   
   
}