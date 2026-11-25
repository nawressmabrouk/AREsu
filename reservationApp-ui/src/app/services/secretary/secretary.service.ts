

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
  private baseUrl = '/api/secretaire';

  constructor(private http: HttpClient) { }
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  
  
  
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/suivreReservations`);
  }


 

getReservationsByStatus(statut: StatusReservation): Observable<Reservation[]> {
  const backendStatut = statut === StatusReservation.ACCEPTEE ? 'ACCEPTÉE' : 
                       statut === StatusReservation.REFUSEE ? 'REFUSÉE' : 
                       statut.toString().toUpperCase(); // Conversion robuste

  return this.http.get<Reservation[]>(
    `${this.baseUrl}/suivreReservationsParStatut/${encodeURIComponent(backendStatut)}`
  );
}



  getViewedReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/viewed`);
  }




  getToViewReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/toView`);
  }

  getToHandleReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/toHandle`);
  }

viewReservation(reservationId: string): Observable<any> {
  return this.http.post(
    `${this.baseUrl}/reservations/view/${reservationId}`, 
    {},
    { responseType: 'text' } 
  );
}

makeDecision(reservationId: string, accepted: boolean, approvedEquipments: string[] = []): Observable<string> {
  const decisionDTO = {
    accepted,
    approvedEquipements: approvedEquipments 
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


getAcceptedReservations(): Observable<Reservation[]> {
  return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/accepted`).pipe(
    map(reservations => reservations.map(res => ({
      ...res,
      statut: this.mapStatus(res.statut) 
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
 
 
 
  getRefusedReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.baseUrl}/reservations/refused`);
  }

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



