import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DatePipe } from '@angular/common';

interface HolidayDTO {
  summary: string;
  start: {
    date?: string;       // For all-day events (format: 'yyyy-MM-dd')
    dateTime?: string;   // For timed events (ISO format)
  };
}
@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  private apiUrl = '/api/calendar'; 

  constructor(
    private http: HttpClient,
    private datePipe: DatePipe
  ) {}

  getPublicHolidays(start: string, end: string): Observable<HolidayDTO[]> {
    return this.http.get<HolidayDTO[]>(
      `${this.apiUrl}/holidays?start=${start}&end=${end}`
    ).pipe(
      catchError(error => {
        console.error('Error fetching holidays:', error);
        return of([]);
      })
    );
  }
}