/*import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` , 
      'Content-Type': 'application/json' }, 
      withCredentials: true
    });
  }
  return next(req);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 403) {
        // Redirect to login or show permission error
        router.navigate(['/unauthorized']);
      }
      return throwError(() => err);
    })
  );
};*/
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Clone request and add headers if token exists
  if (token) {
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${token}`
    };

    // Only add Content-Type for requests with body
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }

    req = req.clone({
      setHeaders: headers,
      withCredentials: true
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url }
        });
      }
      else if (error.status === 403) {
        router.navigate(['/unauthorized']);
      }

      return throwError(() => error);
    })
  );
};


































