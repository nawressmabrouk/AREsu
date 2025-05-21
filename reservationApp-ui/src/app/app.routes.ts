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
import { ChatbotComponent } from './chatbot/chatbot.component';
import { HomeComponent } from './home/home.component';
import { IdOublieComponent } from './mot-de-passe-oubliée/id-oublie/id-oublie.component';
import { ResetPasswordComponent } from './mot-de-passe-oubliée/reset-password/reset-password.component';
import { NavbarComponent } from './navbar/navbar.component';
import { RegisterComponent } from './register/register.component';
import { ReservationFormComponent } from './reservation-form/reservation-form.component';
//import { ReservationsCalendarComponent } from './reservations-calendar/reservations-calendar.component';
import { RoomManagerComponent } from './room-manager/room-manager.component';
import { SecretaryComponent } from './secretary/secretary.component';
import {
  SelectionCalendarComponent
} from './selection-calendar/selection-calendar.component';
import { SpacesComponent } from './spaces/spaces.component';
import { DashboardComponent } from './super-admin/dashboard/dashboard.component';
import { EtablissementCardComponent } from './super-admin/etablissement-card/etablissement-card.component';
import { EtablissementDetailsComponent } from './super-admin/etablissement-details/etablissement-details.component';
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
   
  },
  { 
    path: 'chatbot', 
    component: ChatbotComponent 
  },
  { 
    path: 'secretary',
    component: SecretaryComponent,
   
  },
  { 
    path: 'room-manager',
    component: RoomManagerComponent,
    
  },
  { 
    path: 'reservation-form',
    component: ReservationFormComponent,
    canActivate: [AuthGuard] // For all authenticated users
  },
  { 
  path: 'super-admin/dashboard',
  component: DashboardComponent,
  canActivate: [AuthGuard]
},
  { 
  path: 'super-admin/etablissement-card',
  component: EtablissementCardComponent,
  canActivate: [AuthGuard]
},
  { 
  path: 'super-admin/etablissement-details',
  component: EtablissementDetailsComponent,
  canActivate: [AuthGuard]
},
  { 
    path: 'selection-calendar',
    component: SelectionCalendarComponent,
    canActivate: [AuthGuard]
  },
  /*{ 
  path: 'reservations-calendar',
  component: ReservationsCalendarComponent,
  canActivate: [AuthGuard]
},*/
  { path: '**', redirectTo: '' }
];