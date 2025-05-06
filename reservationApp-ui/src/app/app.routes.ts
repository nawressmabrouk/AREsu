/* old  app.routes.ts
import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AuthGuard } from './auth/auth.guard';
import { AuthComponent } from './auth/auth.component';
import {
  CalendarComponent
} from './calendar/calendar.component';
import { HomeComponent } from './home/home.component';
import { IdOublieComponent } from './id-oublie/id-oublie.component';
import { NavbarComponent } from './navbar/navbar.component';
import { RegisterComponent } from './register/register.component';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';
import { SecretaryComponent } from './secretary/secretary.component';
import { SpacesComponent } from './spaces/spaces.component';

export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent,
  },
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
  { path: 'admin', component: AdminComponent },
  { path: 'secretary', component: SecretaryComponent },
  { path: 'room-manager', component: RoomManagerComponent },
  { path: 'reservation-form', component: ReservationFormComponent },
    { path: 'calendar', component: CalendarComponent },
  { path: '**', redirectTo: '' } // Route de secours (doit être la dernière)
];*/
import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { AuthComponent } from './auth/auth.component';
import { AuthGuard } from './auth/auth.guard';
import {
  CalendarComponent
} from './calendar/calendar.component';
import { HomeComponent } from './home/home.component';
import { IdOublieComponent } from './mot-de-passe-oubliée/id-oublie/id-oublie.component';
import { ResetPasswordComponent } from './mot-de-passe-oubliée/reset-password/reset-password.component';
import { NavbarComponent } from './navbar/navbar.component';
import { RegisterComponent } from './register/register.component';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';
import { SecretaryComponent } from './secretary/secretary.component';
import { SpacesComponent } from './spaces/spaces.component';
export const routes: Routes = [
  { 
    path: '', 
    component: HomeComponent 
  },
  { 
    path: 'navbar',
    component: NavbarComponent,
    children: [
      { path: 'auth', component: AuthComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'id-oublie', component: IdOublieComponent },
    ]
  },
  { 
    path: 'spaces', 
    component: SpacesComponent 
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent 
  },
  // Protected routes below
  { 
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard], // Only for authenticated admin users
    data: { roles: ['ADMIN'] } // Optional role-based protection
  },
  { 
    path: 'secretary',
    component: SecretaryComponent,
    canActivate: [AuthGuard],
    data: { roles: ['SECRETARY'] }
  },
  { 
    path: 'room-manager',
    component: RoomManagerComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'MANAGER'] }
  },
  { 
    path: 'reservation-form',
    component: ReservationFormComponent,
    canActivate: [AuthGuard] // For all authenticated users
  },
  { 
    path: 'calendar',
    component: CalendarComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];