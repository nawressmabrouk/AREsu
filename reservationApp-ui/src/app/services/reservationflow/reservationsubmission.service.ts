/*/ reservation.service.ts
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationsubmissionService {
  private apiUrl = "http://localhost:8080/api/";

  constructor(private http: HttpClient,
    private authService: AuthService

  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
  createReservation(reservationData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/demandeur/demanderReservation`, reservationData, { headers: this.getHeaders() });
  }

  sendReservation(reservationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reservations/${reservationId}/envoyer`, {},
      { headers: this.getHeaders() }
    );
  }
}
*/

import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { User } from '../../shared/interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class ReservationsubmissionService {
  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  createReservation(reservationData: any): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser?.userId) {
      return throwError(() => new Error('No authenticated user available'));
    }

    // Ensure reservation data includes the demandeurId
    const completeReservationData = {
      ...reservationData,
      demandeurId: currentUser.userId
    };

    return this.http.post(
      `${this.apiUrl}/demandeur/demanderReservation`, 
      completeReservationData,
      { 
        headers: this.getHeaders(),
        observe: 'response'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  sendReservation(reservationId: string): Observable<any> {
    if (!reservationId) {
      return throwError(() => new Error('Reservation ID is required'));
    }

    return this.http.post(
      `${this.apiUrl}/reservations/${reservationId}/envoyer`, 
      {},
      { 
        headers: this.getHeaders(),
        observe: 'response'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Could not connect to server';
          break;
        case 400:
          errorMessage = error.error?.message || 'Invalid request data';
          break;
        case 401:
          errorMessage = 'Authentication required';
          break;
        case 403:
          errorMessage = 'Permission denied';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Internal server error';
          break;
        default:
          errorMessage = error.error?.message || `Server returned ${error.status}`;
      }
    }

    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}