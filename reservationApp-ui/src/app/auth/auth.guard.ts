import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

/**
 * Backend roles (tn.sousse.univ.reservation_app.models.Role) as they appear
 * in the "roles" claim of the JWT.
 */
export const Roles = {
  DEMANDEUR_INTERNE: 'ROLE_DEMANDEUR_INTERNE',
  DEMANDEUR_EXTERNE: 'ROLE_DEMANDEUR_EXTERNE',
  SECRETAIRE_GENERALE: 'ROLE_SECRETAIRE_GENERALE',
  ADMIN: 'ROLE_ADMIN',
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  RESPONSABLE_SALLE: 'ROLE_RESPONSABLE_SALLE',
} as const;
export type AppRole = (typeof Roles)[keyof typeof Roles];

function loginRedirect(returnUrl: string) {
  const auth = inject(AuthService);
  auth.clearAuth();
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl } });
}

/** Requires a valid (present and not expired) session, otherwise opens the login page. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthService).isLoggedIn() ? true : loginRedirect(state.url);

/**
 * Requires one of the given roles. A logged-in user with another role is sent
 * to the landing page of their own role instead.
 */
export function roleGuard(...allowed: AppRole[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    if (!auth.isLoggedIn()) {
      return loginRedirect(state.url);
    }
    const roles = auth.getCurrentUser()?.roles ?? [];
    if (roles.some((r) => (allowed as readonly string[]).includes(r))) {
      return true;
    }
    return inject(Router).parseUrl(auth.homeRouteFor(roles[0]));
  };
}

/** Used by the /unauthorized route: sends the user to the landing page of their role. */
export const redirectToRoleHome: CanActivateFn = () => {
  const auth = inject(AuthService);
  const target = auth.isLoggedIn() ? auth.homeRouteFor(auth.getCurrentUser()?.role) : '/';
  return inject(Router).parseUrl(target);
};
