// src/app/services/room-manager.service.ts
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
  private baseUrl = 'http://localhost:8080/api/responsable';
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

  /**
   * Récupère les réservations selon le statut
   * @param status Statut des réservations à filtrer
   */
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

  /**
   * Envoie une décision pour une réservation avec les équipements approuvés
   * @param reservationId ID de la réservation
   * @param accepted Décision (true = acceptée, false = refusée)
   * @param approvedEquipements Liste des équipements approuvés (peut être vide)
   */
makeDecision(reservationId: string, accepted: boolean, approvedEquipments: string[] = []): Observable<string> {
  // Create the DTO object that matches your backend
  const decisionDTO = {
    accepted: accepted,
    approvedEquipements: approvedEquipments // Note: French spelling to match backend
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

  /**
   * Mappe les réservations avec conversion des dates
   * @param reservations Liste des réservations de l'API
   */
  private mapReservations(reservations: any[]): Reservation[] {
    return reservations.map(res => ({
      ...res,
      heureDebut: this.dateConverter.convertToDate(res.heureDebut),
      heureFin: this.dateConverter.convertToDate(res.heureFin),
      statut: this.mapStatus(res.statut) // Conversion du statut
    }));
  }

  /**
   * Convertit le statut de l'API vers le enum frontend
   * @param apiStatus Statut reçu de l'API
   */
  private mapStatus(apiStatus: string): StatusReservation {
    switch(apiStatus) {
      case 'ACCEPTÉE': return StatusReservation.ACCEPTEE;
      case 'REFUSÉE': return StatusReservation.REFUSEE;
      case 'EN_ATTENTE': return StatusReservation.EN_ATTENTE;
      default: return StatusReservation.EN_ATTENTE;
    }
  }

  /**
   * Convertit le statut frontend en endpoint API
   * @param status Statut à convertir
   */
  private getStatusEndpoint(status: StatusReservation): string {
    switch(status) {
      case StatusReservation.ACCEPTEE: return 'acceptees';
      case StatusReservation.REFUSEE: return 'refusees';
      case StatusReservation.EN_ATTENTE: return 'en-attente';
      default: return '';
    }
  }

  /**
   * Gestion centralisée des erreurs
   * @param error Erreur HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
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

  /**
   * Annule une réservation (Responsable d'espace)
   * @param reservationId - ID de la réservation
   * @param reason - (Optionnel) Raison de l'annulation
   */
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

  /**
 * Get all spaces managed by the current responsible
 */
getManagedSpaces(): Observable<Espace[]> {
  return this.http.get<Espace[]>(`${this.baseUrl}/espaces`, {
    headers: this.getAuthHeaders()
  }).pipe(
    catchError(this.handleError)
  );
}


/**
 * Update a space
 * @param spaceId ID of the space to update
 * @param updatedSpace Updated space data
 */
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