// calendar.service.ts
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CalendarSlotDTO } from '../../shared/interfaces/calendar-slot.dto';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = '/api/calendar';
  private readonly MAX_RETRIES = 2;

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe,
    private authService: AuthService
  ) {}

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

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      console.error('Network or client-side error:', error.error);
    } else {
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
    }
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  getCalendarView(
    etablissementId: string,
    espaceId: string,
    date: string,
    userId: string,
    userRole: string
  ): Observable<CalendarSlotDTO[]> {
    // Clean and validate parameters
    const cleanEtablissementId = this.cleanId(etablissementId);
    const cleanEspaceId = this.cleanId(espaceId);
    
    if (!cleanEtablissementId || !cleanEspaceId || !date) {
      return throwError(() => new Error('Invalid parameters: Missing required IDs or date'));
    }

    // Use HttpParams for proper URL encoding
    const params = new HttpParams()
      .set('etablissementId', cleanEtablissementId)
      .set('espaceId', cleanEspaceId)
      .set('date', date);

    return this.http.get<CalendarSlotDTO[]>(
      `${this.apiUrl}/view`,
      {
        headers: this.getHeaders()
          .set('X-User-Id', userId)
          .set('X-User-Role', userRole),
        params: params
      }
    ).pipe(
      catchError(error => {
        console.error('Calendar API Error:', {
          url: `${this.apiUrl}/view`,
          status: error.status,
          error: error.error
        });
        
        let userMessage = 'Server error - please try again later';
        if (error.status === 400) userMessage = 'Invalid request parameters';
        if (error.status === 404) userMessage = 'Resource not found';
        return throwError(() => new Error(userMessage));
      })
    );
  }

  private cleanId(id: string): string {
    if (!id) return '';
    // Remove trailing underscores and any other unwanted characters
    return id.replace(/_+$/, '').trim();
  }
 
getTimeSlots(date: string): Observable<CalendarSlotDTO[]> {
  // Change from '/slots' to '/view'
  return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/view`, { 
    params: new HttpParams().set('date', date),
    headers: this.getHeaders()  // Add authorization headers
  }).pipe(
    map(slots => slots.map(slot => ({
      ...slot,
      heureDebut: new Date(slot.heureDebut),
      heureFin: new Date(slot.heureFin)
    }))),
    catchError(this.handleError)  // Add error handling
  );
}

getUnavailableDates(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/reservations/dates`);
}


getConfirmedEvents(): Observable<CalendarSlotDTO[]> {
  return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/reservations/confirmed`);
}

getUnconfirmedEvents(): Observable<CalendarSlotDTO[]> {
  return this.http.get<CalendarSlotDTO[]>(`${this.apiUrl}/reservations/pending`);
}
}
