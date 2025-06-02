import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private apiUrl = 'http://localhost:8080/api/utilisateurs/inscription';

  constructor(private http: HttpClient) {}
    register(userData: any): Observable<any> {
      return this.http.post(this.apiUrl, userData).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 400 && error.error === 'Cet email existe déjà') {
            return throwError(() => 'Cet email est déjà utilisé');
          }
          return throwError(() => 'Une erreur est survenue lors de l\'inscription');
        })
      );
    }
}

