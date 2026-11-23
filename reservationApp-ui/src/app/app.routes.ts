import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AuthComponent } from './auth/auth.component';
import { authGuard, redirectToRoleHome, roleGuard, Roles } from './auth/auth.guard';
import { ChatComponent } from './chatbot/chatbot.component';
import { HomeComponent } from './home/home.component';
import { IdOublieComponent } from './mot-de-passe-oubliée/id-oublie/id-oublie.component';
import { ResetPasswordComponent } from './mot-de-passe-oubliée/reset-password/reset-password.component';
import { NavbarComponent } from './navbar/navbar.component';
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
  // --- Public pages -------------------------------------------------------
  { path: '', component: HomeComponent },
  {
    path: 'navbar',
    component: NavbarComponent,
    children: [
      { path: 'auth', component: AuthComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'id-oublie', component: IdOublieComponent },
    ],
  },
  { path: 'spaces', component: SpacesComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'chatbot', component: ChatComponent },

  // --- Short aliases used by links and redirects in the app -----------------
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'login', redirectTo: 'navbar/auth', pathMatch: 'full' },
  { path: 'register', redirectTo: 'navbar/register', pathMatch: 'full' },
  { path: 'unauthorized', canActivate: [redirectToRoleHome], children: [] },

  // --- Any logged-in user -------------------------------------------------
  { path: 'reservation-form', component: ReservationFormComponent, canActivate: [authGuard] },
  { path: 'selection-calendar', component: SelectionCalendarComponent, canActivate: [authGuard] },

  // --- Role-specific dashboards -------------------------------------------
  { path: 'admin', component: AdminComponent, canActivate: [roleGuard(Roles.ADMIN)] },
  { path: 'secretary', component: SecretaryComponent, canActivate: [roleGuard(Roles.SECRETAIRE_GENERALE)] },
  { path: 'room-manager', component: RoomManagerComponent, canActivate: [roleGuard(Roles.RESPONSABLE_SALLE)] },
  { path: 'super-admin/dashboard', component: DashboardComponent, canActivate: [roleGuard(Roles.SUPER_ADMIN)] },
  { path: 'super-admin/etablissement-card', component: EtablissementCardComponent, canActivate: [roleGuard(Roles.SUPER_ADMIN)] },
  { path: 'super-admin/etablissement-details', component: EtablissementDetailsComponent, canActivate: [roleGuard(Roles.SUPER_ADMIN)] },

  { path: '**', redirectTo: '' },
];
