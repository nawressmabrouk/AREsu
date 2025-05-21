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
  pageName: string = '';
   currentRoute: string = '';
  // Icons
  faHome = faHome;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faPageIcon = faSignInAlt; // You can change this to the appropriate icon

  // Page info
  updatePageName() {
    switch (this.currentRoute) {
      case 'auth':
        this.pageName = 'Se connecter';
        break;
      case 'register':
        this.pageName = 'S\'inscrire';
        break;
      case 'id-oublie':
        this.pageName = 'password oublié';
        break;
      case 'spaces':
        this.pageName = 'Espaces';
        break;
      
      default:
        this.pageName = 'Accueil';
    }
  }




constructor(private router: Router) {
    // Surveiller les changements de route
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url.split('?')[0].split('/').pop() || '';


      this.updatePageName();
    });
  }
}


