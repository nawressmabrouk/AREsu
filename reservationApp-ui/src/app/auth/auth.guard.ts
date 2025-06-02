import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

// Marks this class as an injectable service available at root level
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  // Method that determines if a route can be activated
  canActivate(
    route: ActivatedRouteSnapshot, // Contains info about the route being accessed
    state: RouterStateSnapshot  // Contains the router state
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Get the current user from the AuthService
    const user = this.authService.getCurrentUser();
    // Get the required roles for the route from route data
    const requiredRoles = route.data['roles'] as Array<string> || [];

    // Check if user is not logged in
    if (!user) {
      // Redirect to login page with returnUrl parameter
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false; // Block access to the route
    }

    // Check if route requires specific roles and user doesn't have them
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      // Redirect to unauthorized page
      this.router.navigate(['/unauthorized']);
      return false;  // Block access to the route
    }

    // If all checks pass, allow access to the route
    return true;
  }
}