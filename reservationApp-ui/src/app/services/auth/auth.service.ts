import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, tap, throwError } from 'rxjs';
import { User } from '../../shared/interfaces/user.interface';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
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
  'ROLE_RESPONSABLE_SALLE',
  'ROLE_SUPER_ADMIN'
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

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
    return !!this.getToken() && !this.isTokenExpired();
  }

  // True if the token is missing, unreadable or past its "exp" claim
  isTokenExpired(token: string | null = this.getToken()): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  // Landing page of each role (used by login, registration and the route guards)
  homeRouteFor(role: string | null | undefined): string {
    const normalized = this.normalizeRole(role ?? '');
    const key = normalized.startsWith('ROLE_') ? normalized : 'ROLE_' + normalized;
    const routes: Record<string, string> = {
      ROLE_DEMANDEUR_INTERNE: '/spaces',
      ROLE_DEMANDEUR_EXTERNE: '/spaces',
      ROLE_SECRETAIRE_GENERALE: '/secretary',
      ROLE_ADMIN: '/admin',
      ROLE_RESPONSABLE_SALLE: '/room-manager',
      ROLE_SUPER_ADMIN: '/super-admin/dashboard',
    };
    return routes[key] ?? '/';
  }
 

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
refreshUserData(): void {
  const token = this.getToken();
  if (token) {
    const userData = this.decodeAndValidateToken(token);
    if (userData) {
      this.saveUserData(userData);
    }
  }
}
  // Clear all auth data
clearAuth(): void {
  localStorage.removeItem(this.tokenKey);
  localStorage.removeItem(this.refreshTokenKey);
  localStorage.removeItem(this.userDataKey);
  this.isAuthenticatedSubject.next(false); 
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

 //  login method with role validation
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
    const userData = this.decodeToken(token);
    
    if (!userData) {
      throw new Error('Token decoding failed');
    }

    if (!userData.roles || userData.roles.length === 0) {
      console.warn('No roles array in token or empty roles array');
      throw new Error('No roles found in token');
    }


    // Normalize and validate roles
    const validatedRoles = userData.roles
      .map((role: string) => {
        const normalized = this.normalizeRole(role);
        return normalized;
      })
      .filter((role: string) => {
        const isValid = this.validRoles.includes(role);
        return isValid;
      });


    if (validatedRoles.length === 0) {
      console.warn('No roles matched validRoles:', this.validRoles); 
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

// Role normalization
private normalizeRole(role: string): string {
  if (!role) return '';
  return role.toUpperCase().replace(/ /g, '_');
}

getCurrentUser(): User & { id: string } | null {
  const userDataStr = localStorage.getItem(this.userDataKey);
  if (userDataStr) {
    try {
      const parsed = JSON.parse(userDataStr);
      
      return {
        id: parsed.userId || parsed.id || parsed.sub, 
        userId: parsed.userId || parsed.sub,
        sub: parsed.sub,
        role: parsed.role,
        roles: parsed.roles
      };
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
    }
  }

  const token = this.getToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      return {
        id: payload.userId || payload.sub, 
        userId: payload.userId || payload.sub,
        sub: payload.sub,
        role: payload.role || '',
        roles: payload.roles || []
      };
    } catch (error) {
      console.error('Error decoding JWT:', error);
    }
  }

  return null;
}

}