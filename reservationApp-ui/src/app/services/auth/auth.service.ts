/*import { HttpClient, HttpHeaders } from '@angular/common/http';
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
// services/auth/auth.service.ts
clearAuth(): void {
  // Clear tokens, user data, etc.
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
}
private clearAllAuthData(): void {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(';').forEach(c => {
    document.cookie = c.replace(/^ +/, '')
      .replace(/=., `=;expires=${new Date().toUTCString()};path=/`);
  });
}
private disableBrowserBack(): void {
  history.pushState(null, '', window.location.href);
  window.onpopstate = () => {
    history.pushState(null, '', window.location.href);
    this.router.navigate(['/login'], { replaceUrl: true });
  };
}

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
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAllAuthData();
        this.disableBrowserBack();
        window.location.href = '/login'; // Redirection forcée
      })
    );
  }
  

  private clearTokenAndRedirect(): void {
    this.clearAllAuthData();
    // Use replaceUrl to prevent back navigation
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      this.clearToken(); // Clear invalid token
      return null;
    }
  }
  
  // Add this to get user info
  getCurrentUser(): any {
    const token = this.getToken();
    if (!token) return null;
    return this.decodeToken(token);
  }
  


// auth.service.ts
private refreshToken(): Observable<any> {
  return this.http.post(`${this.apiUrl}/refresh-token`, {
    refreshToken: this.getRefreshToken()
  });
}

}*/

//ekher version 
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { User } from '../../shared/interfaces/user.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:8080/api/auth';
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly userDataKey = 'user_data';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  // Define valid roles that match your backend
  private validRoles = [
    'ROLE_DEMANDEUR_INTERNE',
  'ROLE_DEMANDEUR_EXTERNE',
  'ROLE_SECRETAIRE_GENERALE',
  'ROLE_ADMIN',
  'ROLE_RESPONSABLE_SALLE'   
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /*
  // Login method with refresh token support
  login(email: string, password: string): Observable<{ token: string, refreshToken: string }> {
    return this.http.post<{ token: string, refreshToken: string }>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      tap(response => {
        this.saveTokens(response.token, response.refreshToken);
        this.saveUserData(this.decodeToken(response.token));
        this.isAuthenticatedSubject.next(true); // Add this line
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }*/

// Add this public method
isAuthenticated(): Observable<boolean> {
  return this.isAuthenticatedSubject.asObservable();
}

  // Save both tokens
  private saveTokens(token: string, refreshToken: string): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  // Save user data
  private saveUserData(userData: any): void {
    localStorage.setItem(this.userDataKey, JSON.stringify(userData));
  }

  // Get access token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Check if user is authenticated
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /* Get current user info  hedhy without role validation
  getCurrentUser(): any {
    const userData = localStorage.getItem(this.userDataKey);
    return userData ? JSON.parse(userData) : null;
  }*/

  // Refresh token implementation
  refreshToken(): Observable<{ token: string, refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearAuth();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ token: string, refreshToken: string }>(
      `${this.apiUrl}/refresh-token`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.saveTokens(response.token, response.refreshToken);
        this.saveUserData(this.decodeToken(response.token));
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  // Logout method
 
 
 
  logout(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const request = refreshToken 
      ? this.http.post(`${this.apiUrl}/logout`, { refreshToken })
      : this.http.post(`${this.apiUrl}/logout`, {});
  
    return request.pipe(
      tap(() => {
        this.clearAuth();
        this.isAuthenticatedSubject.next(false); // Add this line
        this.router.navigate(['/login'], { replaceUrl: true });
      }),
      catchError(error => {
        this.clearAuth();
        this.isAuthenticatedSubject.next(false); // Add this line
        return throwError(() => error);
      })
    );
  }

  // Clear all auth data
clearAuth(): void {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.refreshTokenKey);
  localStorage.removeItem(this.userDataKey);
  this.isAuthenticatedSubject.next(false); // Add this line
}

  // Decode JWT token
   decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = decodeURIComponent(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      this.clearAuth();
      return null;
    }
  }

  // Prevent back navigation after logout
  private disableBrowserBack(): void {
    history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      history.pushState(null, '', window.location.href);
      this.router.navigate(['/login'], { replaceUrl: true });
    };
  }

 // Modified login method with role validation
 login(email: string, password: string): Observable<{ token: string, refreshToken: string }> {
  return this.http.post<{ token: string, refreshToken: string }>(
    `${this.apiUrl}/login`,
    { email, password }
  ).pipe(
    tap(response => {
      const userData = this.decodeAndValidateToken(response.token);
      if (!userData) {
        throw new Error('Invalid token or role');
      }
      this.saveTokens(response.token, response.refreshToken);
      this.saveUserData(userData);
      this.isAuthenticatedSubject.next(true);
    }),
    catchError(error => {
      this.clearAuth();
      return throwError(() => error);
    })
  );
}

// Enhanced token decoding with role validation
private decodeAndValidateToken(token: string): any {
  try {
    console.log('Raw token:', token); // Debug
    const userData = this.decodeToken(token);
    console.log('Decoded token data:', userData); // Debug
    
    if (!userData) {
      throw new Error('Token decoding failed');
    }

    if (!userData.roles || userData.roles.length === 0) {
      console.warn('No roles array in token or empty roles array');
      throw new Error('No roles found in token');
    }

    console.log('Original roles from token:', userData.roles); // Debug

    // Normalize and validate roles
    const validatedRoles = userData.roles
      .map((role: string) => {
        const normalized = this.normalizeRole(role);
        console.log(`Role: ${role} → Normalized: ${normalized}`); // Debug
        return normalized;
      })
      .filter((role: string) => {
        const isValid = this.validRoles.includes(role);
        console.log(`Checking role ${role}: ${isValid}`); // Debug
        return isValid;
      });

    console.log('Validated roles:', validatedRoles); // Debug

    if (validatedRoles.length === 0) {
      console.warn('No roles matched validRoles:', this.validRoles); // Debug
      throw new Error('No valid roles found');
    }

    return {
      ...userData,
      roles: validatedRoles,
      role: validatedRoles[0]
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    this.clearAuth();
    return null;
  }
}
/*
private decodeAndValidateToken(token: string): any {
  try {
    const userData = this.decodeToken(token);
    
    if (!userData || !userData.roles || userData.roles.length === 0) {
      throw new Error('No roles found in token');
    }

    // Normalize and validate roles
    const validatedRoles = userData.roles
      .map((role: string) => {
        // Remove ROLE_ prefix if present
        const normalized = role.replace(/^ROLE?_/, '');
        return this.normalizeRole(normalized);
      })
      .filter((role: string) => this.validRoles.includes(role));

    if (validatedRoles.length === 0) {
      throw new Error('No valid roles found');
    }

    return {
      ...userData,
      roles: validatedRoles,
      role: validatedRoles[0] // Main role is first in array
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    this.clearAuth();
    return null;
  }
}*/
// Role normalization

private normalizeRole(role: string): string {
  if (!role) return '';
  // Keep the ROLE_ prefix if present
  return role.toUpperCase().replace(/ /g, '_');
}

getCurrentUser(): User & { id: string } | null {
  // Version 1 approach - get from token if no user data
  const token = this.getToken();
  if (!token) return null;

  // Try version 2 approach first (from localStorage)
  const userDataStr = localStorage.getItem(this.userDataKey);
  if (userDataStr) {
    try {
      const parsed = JSON.parse(userDataStr);
     
      // Normalize roles
      const roles = parsed.roles?.map((r: string) => this.normalizeRole(r)) || [];
      const role = roles.length > 0 ? roles[0] : '';

      return {
        id: parsed.id || parsed.sub || parsed.userId,
        userId: parsed.userId || parsed.sub,
        sub: parsed.sub,
        role: role,
        roles: roles
      };
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Fall through to version 1 approach
    }
  }

  // Version 1 fallback - decode from token
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('JWT Payload:', payload);
   
    return {
      id: payload.userId || payload.sub,
      userId: payload.userId || payload.sub,
      sub: payload.sub,
      role: payload.role || '',
      roles: payload.roles || []
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/* hedhy version m3a nourhen 
getCurrentUser(): User | null {
  // D'abord essayer avec le JWT (plus sécurisé)
  const token = this.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('JWT Payload:', payload);
      
      return {
        id: payload.userId || payload.sub,
        userId: payload.userId,
        sub: payload.sub,
        role: this.normalizeRole(payload.role),
        roles: payload.roles?.map((r: string) => this.normalizeRole(r))
      };
    } catch (error) {
      console.error('Error parsing JWT:', error);
    }
  }

  // Fallback sur localStorage si JWT absent ou invalide
  const userData = localStorage.getItem(this.userDataKey);
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    return {
      id: parsed.id || parsed.sub || parsed.userId,
      userId: parsed.userId || parsed.sub,
      sub: parsed.sub,
      role: this.normalizeRole(parsed.role),
      roles: parsed.roles?.map((r: string) => this.normalizeRole(r))
    };
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}*/



/* version mte3y  temchi mrigla Updated getCurrentUser with role validation
getCurrentUser(): User | null {
  const userData = localStorage.getItem(this.userDataKey);
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    return {
      id: parsed.id || parsed.sub || parsed.userId,
      userId: parsed.userId || parsed.sub,
      sub: parsed.sub,
      role: this.normalizeRole(parsed.role),
      roles: parsed.roles?.map((r: string) => this.normalizeRole(r))
    };
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}*/


}