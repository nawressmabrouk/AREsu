import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable ,  throwError } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No token available!');
      // Handle this case - perhaps redirect to login
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Get user profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/utilisateurs/voirProfil`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map((response: any) => {
        // Check if response exists
        if (!response) {
          throw new Error('Aucune donnée reçue');
        }
        return {
          nom: response.nom || '',
          prenom: response.prenom || '',
          email: response.email || '',
          numTel: response.numTel || '',
          fonction: response.fonction || '',
          nomEtablissement: response.nomEtablissement || '',
          structure: response.structure || '',
          linkedInLink: response.linkedInLink || '',
          role: response.role || ''
        };
      })
    );
  }



  // Update profile
  updateProfile(profileData: any): Observable<any> {
    // Structure data as expected by backend
    const requestData = {
      nom: profileData.nom,
      prenom: profileData.prenom,
      email: profileData.email, // Added to identify user
      numTel: profileData.numTel,
      fonction: profileData.fonction,
      nomEtablissement: profileData.nomEtablissement,
      structure: profileData.structure,
      linkedInLink: profileData.linkedInLink
    };

    console.log('Données envoyées au backend:', JSON.stringify(requestData, null, 2));

    return this.http.put(`${this.apiUrl}/utilisateurs/modifierProfil`, requestData, {
      headers: this.getAuthHeaders(),
      observe: 'response' // To see full response
    }).pipe(
      tap(response => console.log('Réponse du backend:', response)),
      map(response => response.body), // Extract response body
      catchError(error => {
        console.error('Erreur détaillée:', error);
        if (error.error instanceof ErrorEvent) {
          console.error('Erreur client:', error.error.message);
        } else {
          console.error(`Code d'erreur: ${error.status}, body: ${JSON.stringify(error.error)}`);
        }
        throw error;
      })
    );
  }

  // Change password

changePassword(passwordData: any): Observable<any> {
  const payload = {
    ancienMotDePasse: passwordData.oldPassword,
    nouveauMotDePasse: passwordData.newPassword
  };

  return this.http.post(`${this.apiUrl}/utilisateurs/changer-mot-de-passe`, payload, { 
    headers: this.getAuthHeaders(),
    responseType: 'text' // Tell Angular to expect text response
  }).pipe(
    tap(response => console.log('Password change response:', response)),
    map(response => ({ message: response })), // Convert to object
    catchError(error => {
      console.error('Detailed password change error:', error);
      throw error;
    })
  );
}
  // Logout
  logout(): Observable<any> {
    return this.http.post(`http://localhost:8080/api/auth/logout`, {}, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get reservations (for demandeur only)
  // Récupération des réservations
// user.service.ts
getReservations(): Observable<any[]> {
  const userId = this.authService.getCurrentUser()?.id;
  return this.http.get<any[]>(
    `${this.apiUrl}/demandeur/${userId}/reservations`,
    { headers: this.getAuthHeaders() }
  );
}


  // Annulation réservation
  cancelReservation(reservationId: string): Observable<any> {
    const userId = this.authService.getCurrentUser()?.id;
    return this.http.post(
      `${this.apiUrl}/demandeur/annulerReservation?reservationId=${reservationId}&demandeurId=${userId}`,
      {},
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // Traduction des statuts
  private translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ATTRIBUÉE': 'Attribuée au responsable',
      'VALIDÉE': 'Validée',
      'ANNULÉE': 'Annulée',
      'REFUSÉE': 'Refusée'
    };
    return statusMap[status] || status;
  }

  // Gestion des erreurs
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.status === 401 || error.status === 403) {
      this.authService.logout(); 
      errorMessage = 'Session expirée, veuillez vous reconnecter';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Erreur:', error);
    return throwError(() => new Error(errorMessage));
  }
}               
