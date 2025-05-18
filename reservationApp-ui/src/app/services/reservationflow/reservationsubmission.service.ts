
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

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
    return this.http.post(
      `${this.apiUrl}/demandeur/demanderReservation`, 
      reservationData,
      { 
        headers: this.getHeaders(),
        responseType: 'json'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }
  

  sendReservation(reservationId: string): Observable<any> {
    return this.http.post(
    `${this.apiUrl}/reservations/${reservationId}/envoyer`,
      {},
      { 
        headers: this.getHeaders(),
       responseType: 'text'
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  private getHeaders() {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    }
    if (error.status === 200 && typeof error.error === 'string') {
      console.warn('Received 200 status with non-JSON response');
      return throwError(() => new Error('Server returned unexpected format'));
    }

     else {
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
          errorMessage = error.error?.message || 'Internal server error';
          break;
        default:
          errorMessage = error.error?.message || `Server returned ${error.status}`;
      }
    }
    
    console.error('API Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}