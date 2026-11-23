import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Reservation, StatusReservation } from '../../models/reservation.model';
import { DateConverterService } from '../date-converter/date-converter.service';
import { Espace } from '../../models/espace.model';
@Injectable({
  providedIn: 'root'
})
export class RoomManagerService {
  private baseUrl = '/api/responsable';
  private allReservations: Reservation[] = [];

  constructor(
    private http: HttpClient,
    private dateConverter: DateConverterService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  private updateAllReservations(newReservations: Reservation[], status: StatusReservation): void {
    this.allReservations = [
      ...this.allReservations.filter(r => r.statut !== status),
      ...newReservations
    ];
  }
 
  getReservationsByStatus(status: StatusReservation): Observable<Reservation[]> {
    const endpoint = this.getStatusEndpoint(status);
    return this.http.get<any[]>(`${this.baseUrl}/reservations/${endpoint}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(reservations => reservations.map(res => ({
        ...res,
        statut: this.mapStatus(res.statut),
        heureDebut: new Date(res.heureDebut),
        heureFin: new Date(res.heureFin)
      }))),
      map(mappedReservations => {
        this.allReservations = [
          ...this.allReservations.filter(r => r.statut !== status),
          ...mappedReservations
        ];
        return mappedReservations;
      }),
      catchError(this.handleError)
    );
  }

makeDecision(reservationId: string, accepted: boolean, approvedEquipments: string[] = []): Observable<string> {
  // Create the DTO object that matches your backend
  const decisionDTO = {
    accepted: accepted,
    approvedEquipements: approvedEquipments 
  };

  return this.http.post(
    `${this.baseUrl}/decision/${reservationId}`,
    decisionDTO, // Send as request body
    { 
      headers: this.getAuthHeaders(),
      responseType: 'text'
    }
  ).pipe(
    catchError(this.handleError)
  );
}

  private mapReservations(reservations: any[]): Reservation[] {
    return reservations.map(res => ({
      ...res,
      heureDebut: this.dateConverter.convertToDate(res.heureDebut),
      heureFin: this.dateConverter.convertToDate(res.heureFin),
      statut: this.mapStatus(res.statut) // Conversion du statut
    }));
  }
 
  private mapStatus(apiStatus: string): StatusReservation {
    switch(apiStatus) {
      case 'ACCEPTÉE': return StatusReservation.ACCEPTEE;
      case 'REFUSÉE': return StatusReservation.REFUSEE;
      case 'EN_ATTENTE': return StatusReservation.EN_ATTENTE;
      default: return StatusReservation.EN_ATTENTE;
    }
  }
 
  private getStatusEndpoint(status: StatusReservation): string {
    switch(status) {
      case StatusReservation.ACCEPTEE: return 'acceptees';
      case StatusReservation.REFUSEE: return 'refusees';
      case StatusReservation.EN_ATTENTE: return 'en-attente';
      default: return '';
    }
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch(error.status) {
        case 403:
          errorMessage = 'Autorisation refusée';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 400:
          errorMessage = error.error?.message || 'Requête invalide';
          break;
        case 500:
          errorMessage = 'Erreur interne du serveur';
          break;
        default:
          errorMessage = `Code d'erreur: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  getReservationCountByStatus(status: StatusReservation): number {
    return this.allReservations.filter(r => r.statut === status).length;
  }
 
  cancelReservation(reservationId: string, reason?: string): Observable<string> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }

    return this.http.post(
      `${this.baseUrl}/reservations/cancel/${reservationId}`,
      null,
      { 
        params,
        headers: this.getAuthHeaders(),
        responseType: 'text' 
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

getManagedSpaces(): Observable<Espace[]> {
  return this.http.get<Espace[]>(`${this.baseUrl}/espaces`, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(this.handleError)
  );
}


updateSpace(spaceId: string, updatedSpace: Espace): Observable<Espace> {
  return this.http.put<Espace>(
    `${this.baseUrl}/espaces/${spaceId}`,
    updatedSpace,
    { headers: this.getAuthHeaders() }
  ).pipe(
    catchError(this.handleError)
  );
}


deleteSpace(spaceId: string): Observable<string> {
  return this.http.delete(
    `${this.baseUrl}/espaces/${spaceId}`,
    { 
      headers: this.getAuthHeaders(),
      responseType: 'text'
    }
  ).pipe(
    catchError(this.handleError)
  );
}
 

}