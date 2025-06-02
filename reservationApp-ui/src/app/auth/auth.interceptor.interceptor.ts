import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

// Define the auth interceptor function
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Inject the AuthService and Router dependencies
  const authService = inject(AuthService);
  const router = inject(Router);
  
   // List of endpoints that should bypass the interceptor (no JWT added)
  const excludedUrls = [
    '/api/auth/login',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ];

   // Check if the current request URL matches any excluded URL
  if (excludedUrls.some(url => req.url.includes(url))) {

    // If excluded, pass the request through without modification
    return next(req); 
  }

  // Get the authentication token from the AuthService
  const token = authService.getToken();

  // If a token exists, clone the request and add authorization headers
  if (token) {
    // Initialize headers object with Authorization
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${token}`
    };

    // Add Content-Type header for POST, PUT, and PATCH requests
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }

    // Clone the request with new headers and credentials
    req = req.clone({
      setHeaders: headers,
      withCredentials: true
    });
  }

  // Pass the request through and handle potential errors
  return next(req).pipe(
    // Catch any errors in the response
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


































