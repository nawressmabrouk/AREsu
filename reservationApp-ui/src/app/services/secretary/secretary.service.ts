

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Reservation, StatusReservation } from '../../models/reservation.model';
import { catchError } from 'rxjs/operators';
import { HttpHeaders} from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class SecretaryService {
  private baseUrl = 'http://localhost:8080/api/secretaire';

  constructor(private http: HttpClient) { }
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  /**
   * Récupère toutes les réservations de l'établissement
   */
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/suivreReservations`);
  }



  /**
   * Récupère les réservations filtrées par statut
   * @param statut - Statut de filtration (StatusReservation enum)
   */
// SecretaryService - BONNE version
getReservationsByStatus(statut: StatusReservation): Observable<Reservation[]> {
  const backendStatut = statut === StatusReservation.ACCEPTEE ? 'ACCEPTÉE' : 
                       statut === StatusReservation.REFUSEE ? 'REFUSÉE' : 
                       statut.toString().toUpperCase(); // Conversion robuste

  return this.http.get<Reservation[]>(
    `${this.baseUrl}/suivreReservationsParStatut/${encodeURIComponent(backendStatut)}`
  );
}
  /**
   * Récupère les réservations déjà vues par le secrétaire
   */
  getViewedReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/viewed`);
  }

  /**
   * Récupère les réservations à visualiser (provenant des responsables)
   */
  getToViewReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/toView`);
  }

  /**
   * Récupère les réservations à traiter directement par le secrétaire
   */
  getToHandleReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/toHandle`);
  }

  /**
   * Marque une réservation comme "vue" par le secrétaire
   * @param reservationId - ID de la réservation à marquer
   */
viewReservation(reservationId: string): Observable<any> {
  return this.http.post(
    `${this.baseUrl}/reservations/view/${reservationId}`, 
    {},
    { responseType: 'text' } // Spécifie le type de réponse
  );
}

  /**
   * Soumet la décision du secrétaire pour une réservation
   * @param reservationId - ID de la réservation
   * @param accepted - Décision (true = acceptée, false = refusée)
   */
makeDecision(reservationId: string, accepted: boolean, approvedEquipments: string[] = []): Observable<string> {
  // Create the DTO with backend-compatible property name
  const decisionDTO = {
    accepted,
    approvedEquipements: approvedEquipments // Map frontend name -> backend name
  };

  return this.http.post(
    `${this.baseUrl}/decision/${reservationId}`,
    decisionDTO,
    { 
      headers: this.getAuthHeaders(),
      responseType: 'text'
    }
  )
}


/**
   * Récupère les réservations acceptées par le secrétaire général
   */
getAcceptedReservations(): Observable<Reservation[]> {
  return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/accepted`).pipe(
    map(reservations => reservations.map(res => ({
      ...res,
      statut: this.mapStatus(res.statut) // Convertit le statut backend -> frontend
    })))
  );
}

private mapStatus(apiStatus: string): StatusReservation {
  switch(apiStatus) {
    case 'ACCEPTÉE': return StatusReservation.ACCEPTEE;
    case 'REFUSÉE': return StatusReservation.REFUSEE;
    case 'EN_ATTENTE': return StatusReservation.EN_ATTENTE;
    default: return StatusReservation.EN_ATTENTE;
  }
}
  /**
   * Récupère les réservations refusées par le secrétaire général
   */
  getRefusedReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/refused`);
  }

  /**
 * Annule une réservation (Secrétaire Général)
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
    {},
    { 
      params,
      responseType: 'text' 
    }
  );
}




} 



