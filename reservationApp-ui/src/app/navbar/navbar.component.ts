import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,    // Required for *ngIf
    RouterModule,    // Required for routerLink and router-outlet
    FontAwesomeModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  // Icons
  faHome = faHome;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faPageIcon = faSignInAlt; // You can change this to the appropriate icon

  // Page info
  pageName = 'Authentication';
  currentRoute = false; // You should set this based on actual route

  constructor(private router: Router) {
    // Example of setting currentRoute based on navigation
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url !== '/home';
    });
  }
}