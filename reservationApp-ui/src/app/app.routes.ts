import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AuthComponent } from './auth/auth.component';
import { authGuard, redirectToRoleHome, roleGuard, Roles } from './auth/auth.guard';
import { AssistantPageComponent } from './chatbot/assistant-page.component';
import { HomeComponent } from './home/home.component';
import { IdOublieComponent } from './mot-de-passe-oubliée/id-oublie/id-oublie.component';
import { ResetPasswordComponent } from './mot-de-passe-oubliée/reset-password/reset-password.component';
import { AdaptiveLayoutComponent } from './layout/adaptive-layout.component';
import { PublicLayoutComponent } from './layout/public-layout.component';
import { ShellLayoutComponent } from './layout/shell-layout.component';
import { RegisterComponent } from './register/register.component';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';
import { SecretaryComponent } from './secretary/secretary.component';
import { SelectionCalendarComponent } from './selection-calendar/selection-calendar.component';
import { SpacesComponent } from './spaces/spaces.component';
import { DashboardComponent } from './super-admin/dashboard/dashboard.component';
import { EtablissementCardComponent } from './super-admin/etablissement-card/etablissement-card.component';
import { EtablissementDetailsComponent } from './super-admin/etablissement-details/etablissement-details.component';

export const routes: Routes = [
  // --- Public pages: shared top navbar + footer -----------------------------
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'login', component: AuthComponent, title: 'Connexion' },
      { path: 'register', component: RegisterComponent, title: 'Créer un compte' },
      { path: 'mot-de-passe-oublie', component: IdOublieComponent, title: 'Mot de passe oublié' },
      { path: 'reset-password', component: ResetPasswordComponent, title: 'Nouveau mot de passe' },
      { path: 'chatbot', component: AssistantPageComponent, title: 'Assistant' },
    ],
  },
  // --- Spaces catalogue: app shell when logged in, public navbar otherwise ---
  {
    path: 'spaces',
    component: AdaptiveLayoutComponent,
    children: [{ path: '', component: SpacesComponent, title: 'Espaces' }],
  },

  // --- Old URLs and aliases (links in e-mails, bookmarks, redirects) --------
  { path: 'navbar/auth', redirectTo: 'login', pathMatch: 'full' },
  { path: 'navbar/register', redirectTo: 'register', pathMatch: 'full' },
  { path: 'navbar/id-oublie', redirectTo: 'mot-de-passe-oublie', pathMatch: 'full' },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'unauthorized', canActivate: [redirectToRoleHome], children: [] },

  // --- Logged-in pages: app shell (sidebar, top bar, breadcrumb) -------------
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      // Any logged-in user
      { path: 'selection-calendar', component: SelectionCalendarComponent, title: 'Choisir un créneau' },
      { path: 'reservation-form', component: ReservationFormComponent, title: 'Demande de réservation' },

      // Role-specific dashboards
      { path: 'admin', component: AdminComponent, canActivate: [roleGuard(Roles.ADMIN)], title: 'Administration' },
      { path: 'secretary', component: SecretaryComponent, canActivate: [roleGuard(Roles.SECRETAIRE_GENERALE)], title: 'Réservations' },
      { path: 'room-manager', component: RoomManagerComponent, canActivate: [roleGuard(Roles.RESPONSABLE_SALLE)], title: 'Mes espaces et demandes' },
      { path: 'super-admin/dashboard', component: DashboardComponent, canActivate: [roleGuard(Roles.SUPER_ADMIN)], title: 'Établissements' },
      { path: 'super-admin/etablissement-card', component: EtablissementCardComponent, canActivate: [roleGuard(Roles.SUPER_ADMIN)], title: 'Établissement' },
      { path: 'super-admin/etablissement-details', component: EtablissementDetailsComponent, canActivate: [roleGuard(Roles.SUPER_ADMIN)], title: 'Détails de l’établissement' },
    ],
  },

  { path: '**', redirectTo: '' },
];
