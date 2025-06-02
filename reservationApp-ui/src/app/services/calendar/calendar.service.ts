import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CalendarSlotDTO } from '../../shared/interfaces/calendar-slot.dto';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = '/api/calendar'; // Base API endpoint
  private readonly MAX_RETRIES = 2; // Retry attempts for failed requests

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
    private authService: AuthService
  ) {}

  // Creates authenticated request headers
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      throw new Error('Authentication token not available');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Centralized error handling
  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('Network or client-side error:', error.error);
    } else {
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
    }
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }
 
  
  confirmEvent(id: string, accepted: boolean = true): Observable<CalendarSlotDTO> {
    if (!id) {
      return throwError(() => new Error('Reservation ID is required'));
    }

    return this.http.post<CalendarSlotDTO>(
      `${this.apiUrl}/decision/${id}`,
      null, 
      {
        headers: this.getHeaders(),
        params: new HttpParams().set('accepted', accepted.toString())
      }
    ).pipe(
      map(response => {
        // Convert date strings to Date objects if needed
        if (typeof response.heureDebut === 'string') {
          response.heureDebut = new Date(response.heureDebut);
        }
        if (typeof response.heureFin === 'string') {
          response.heureFin = new Date(response.heureFin);
        }
        return response;
      }),
      catchError(error => {
        // Enhanced error handling with user-friendly messages
        let userMessage = 'Failed to process decision';
        
        if (error.status === 404) {
          userMessage = 'Reservation not found';
        } else if (error.status === 400) {
          userMessage = error.error?.erreur || 'Invalid request';
        } else if (error.status === 500) {
          userMessage = 'Server error - please try again later';
        }

        console.error('Decision API Error:', {
          url: `${this.apiUrl}/decision/${id}`,
          status: error.status,
          error: error.error
        });

        return throwError(() => new Error(userMessage));
      })
    );
  }


getCalendarView(
  etablissementId: string,
  date: string
): Observable<CalendarSlotDTO[]> {
  return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/view`, {
    params: new HttpParams()
      .set('date', date)
      .set('etablissementId', etablissementId),
    headers: this.getHeaders()
  }).pipe(
    map(slots => slots.map(slot => ({
      ...slot,
      heureDebut: new Date(slot.heureDebut),
      heureFin: new Date(slot.heureFin)
    })))
  );
}

  // Sanitizes input IDs
  private cleanId(id: string): string {
    if (!id) return '';
    return id.replace(/_+$/, '').trim();
  }

  getTimeSlots(date: string): Observable<CalendarSlotDTO[]> {
    return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/slots`, { 
      params: new HttpParams().set('date', date),
      headers: this.getHeaders()
    }).pipe(
      map(slots => slots.map(slot => ({
        ...slot,
        heureDebut: new Date(slot.heureDebut),
        heureFin: new Date(slot.heureFin)
      }))),
      catchError(this.handleError)
    );
  }

 

getUnavailableDates(etablissementId: string, espaceId: string): Observable<string[]> {
  if (!etablissementId || !espaceId) {
    return throwError(() => new Error('Both establishment and space IDs are required'));
  }

  return this.http.get<string[]>(`${this.apiUrl}/reservations/dates`, {
    headers: this.getHeaders(),
    params: new HttpParams()
      .set('etablissementId', etablissementId)
      .set('espaceId', espaceId)
  }).pipe(
    catchError(this.handleError)
  );
}

getConfirmedEvents(etablissementId: string): Observable<CalendarSlotDTO[]> {
  return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/reservations/confirmed`, {
    headers: this.getHeaders(),
    params: new HttpParams().set('etablissementId', etablissementId)
  }).pipe(
    map(slots => slots.map(slot => ({
      ...slot,
      heureDebut: new Date(slot.heureDebut),
      heureFin: new Date(slot.heureFin)
    }))),
    catchError(this.handleError)
  );
}

getUnconfirmedEvents(etablissementId: string): Observable<CalendarSlotDTO[]> {
  return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/reservations/pending`, {
    headers: this.getHeaders(),
    params: new HttpParams().set('etablissementId', etablissementId)
  }).pipe(
    map(slots => slots.map(slot => ({
      ...slot,
      heureDebut: new Date(slot.heureDebut),
      heureFin: new Date(slot.heureFin)
    }))),
    catchError(this.handleError)
  );
}

getEspaceNom(etablissementId: string): Observable<{ espaceNom: string }> {
  return this.http.get<{ espaceNom: string }>(
    `${this.apiUrl}/espace-name`,
    {
      headers: this.getHeaders(),
      params: new HttpParams().set('etablissementId', etablissementId)
    }
  ).pipe(
    catchError(this.handleError)
  );
}
}