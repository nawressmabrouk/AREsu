// calendar.service.ts
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  getUnavailableSlotsForSpace(espaceId: string, date: string): Observable<string[]> {
    const cleanEspaceId = this.cleanId(espaceId);
    if (!cleanEspaceId || !date) {
      return of([]);
    }

    const params = new HttpParams()
      .set('espaceId', cleanEspaceId)
      .set('date', date);

    return this.http.get<string[]>(
      `${this.apiUrl}/unavailableSlots/space`,
      { 
        headers: this.getHeaders(),
        params: params
      }
    ).pipe(
      catchError(error => {
        console.error('Error fetching unavailable slots:', error);
        return of([]);
      })
    );
  }
}
/*
  getCalendarView(
    etablissementId: string,
    espaceId: string,
    date: string,
    userId: string,
    userRole: string
  ): Observable<CalendarSlotDTO[]> {
    // Validate parameters
    if (!etablissementId || !espaceId || !date || !userId || !userRole) {
      console.error('Missing required parameters');
      return of([]);
    }

    // Construct URL with proper encoding
    const url = `${this.apiUrl}/view?` + 
      `etablissementId=${encodeURIComponent(etablissementId)}` +
      `&espaceId=${encodeURIComponent(espaceId)}` +
      `&date=${encodeURIComponent(date)}`;

    return this.http.get<CalendarSlotDTO[]>(url, {
      headers: this.getHeaders()
        .set('X-User-Id', userId)
        .set('X-User-Role', userRole)
    }).pipe(
      catchError(error => {
        console.error('Error loading calendar view:', error);
        if (error.status === 403) {
          // Handle forbidden error specifically
          console.error('Access denied - insufficient permissions');
          // You might want to redirect or show a message to the user
        }
        return of([]);
      })
    );
  }*/
  
