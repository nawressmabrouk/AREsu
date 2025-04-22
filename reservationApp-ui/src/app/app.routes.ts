// app.routes.ts
import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { CalendarComponent } from './calendar/calendar.component';
import { IdOublieComponent } from './id-oublie/id-oublie.component';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';
import { SecretaryComponent } from './secretary/secretary.component';
import { SpacesComponent } from './spaces/spaces.component';
import { AdminComponent } from './admin/admin.component';
import { NavbarComponent } from './navbar/navbar.component';

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
  { path: 'reservation/:id', component: ReservationFormComponent },
  { path: 'calendar', component: CalendarComponent }, // Cette route doit être avant **
  { path: '**', redirectTo: '' } // Route de secours (doit être la dernière)
];