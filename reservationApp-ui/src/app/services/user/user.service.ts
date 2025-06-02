import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable ,  throwError } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { map, tap, catchError } from 'rxjs/operators';
import { User , Role } from '../../shared/interfaces/user.model';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.error('No token available!');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }


   get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
  
   setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  // Get user profile
getProfile(): Observable<User> {
  return this.http.get(`${this.apiUrl}/utilisateurs/voirProfil`, { 
    headers: this.getAuthHeaders() 
  }).pipe(
    map((response: any) => {
      if (!response) {
        throw new Error('Aucune donnée reçue');
      }
      
      // Log the raw response
      console.log('Raw profile response:', response);
      
      return {
        id: response._id || response.id || '', 
        nom: response.nom || '',
        prenom: response.prenom || '',
        email: response.email || '',
        numTel: response.numTel || '',
        role: response.role as Role,
        fonction: response.fonction || '',
        nomEtablissement: response.nomEtablissement || '',
        etablissementId: response.etablissementId || '', 
        structure: response.structure || '',
        linkedInLink: response.linkedInLink || '',
        enabled: response.enabled || false,
        passwordChangeRequired: response.passwordChangeRequired || false,
        isPartenaire: response.isPartenaire || false,
        espacesResponsables: response.espacesResponsables || []
      };
    })
  );
}



updateProfile(profileData: any): Observable<any> {
    const requestData: {
      nom: any;
      prenom: any;
      numTel: any;
      fonction: any;
      nomEtablissement: any;
      structure: any;
      linkedInLink: any;
      role?: string; 
    } = {
      nom: profileData.nom,
      prenom: profileData.prenom,
      numTel: profileData.numTel,
      fonction: profileData.fonction,
      nomEtablissement: profileData.nomEtablissement,
      structure: profileData.structure,
      linkedInLink: profileData.linkedInLink, 
      role: profileData.role, 
      
    };

    const currentUser = this.currentUserValue;
    if (currentUser && 
        (currentUser.role === Role.DEMANDEUR_INTERNE || 
         currentUser.role === Role.DEMANDEUR_EXTERNE) &&
        profileData.role) {
      requestData.role = profileData.role;
    }

    return this.http.put(`${this.apiUrl}/utilisateurs/modifierProfil`, requestData, {
      headers: this.getAuthHeaders(),
      observe: 'response'
    }).pipe(
      tap(response => {
        console.log('Réponse du backend:', response);
        // After successful update, refresh user data
        if (response.status === 200) {
          this.authService.refreshUserData();
        }
      }),
      map(response => response.body),
      catchError(error => {
        console.error('Erreur détaillée:', error);
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
getReservations(): Observable<any[]> {
  const userId = this.authService.getCurrentUser()?.id;
  return this.http.get<any[]>(
    `${this.apiUrl}/demandeur/${userId}/reservations`,
    { headers: this.getAuthHeaders() }
  );
}


  // cancel reservation
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
