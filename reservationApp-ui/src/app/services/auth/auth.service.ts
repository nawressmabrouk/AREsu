import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {  // Renamed from LoginService to AuthService
  private readonly apiUrl = 'http://localhost:8080/api/auth';
  private readonly tokenKey = 'auth_token';

  constructor(
    private http: HttpClient,
    private router: Router  // Added for navigation after logout
  ) {}

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      `${this.apiUrl}/login`, 
      { email, password }
    ).pipe(
      tap(response => {
        if (response?.token) {
          this.saveToken(response.token);
        }
      }),
      catchError(error => {
        this.clearToken();  // Clear token on login failure
        return throwError(() => error);
      })
    );
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    console.debug('Token saved');  // Removed token from log for security
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {  // New helper method
    return !!this.getToken();
  }

  logout(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      console.warn('No token found for logout');
      this.clearTokenAndRedirect();
      return throwError(() => new Error('No authentication token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(
      `${this.apiUrl}/logout`, 
      {}, 
      { headers }
    ).pipe(
      tap(() => {
        this.clearTokenAndRedirect();
        console.log('Logout successful');
      }),
      catchError(error => {
        this.clearTokenAndRedirect();  // Clear token even if API call fails
        return throwError(() => error);
      })
    );
  }

  private clearTokenAndRedirect(): void {
    this.clearToken();
    this.router.navigate(['/login']);  // Redirect to login page
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }
}