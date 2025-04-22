// src/app/services/room-manager.service.ts
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomManagerService {
  private baseUrl = 'http://localhost:8080/api/responsable';

  constructor(private http: HttpClient) {}

  makeDecision(reservationId: string, accepted: boolean): Observable<string> {
    const url = `${this.baseUrl}/decision/${reservationId}`;
    const params = new HttpParams().set('accepted', accepted.toString());

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.post(url, null, {
      params,
      headers,
      responseType: 'text'
    });
  }
}
