import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faHome,  
  faArrowRight    // Fichier avec stylo
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FontAwesomeModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  
 
// Icône Font Awesome
faHome = faHome; 
faPageIcon =  faArrowRight; // ou une autre icône
  currentRoute: string = ''; // Pour afficher le chemin de navigation (breadcrumb)
  pageName: string = ''; // Pour afficher le nom de la page

  constructor(private router: Router) {
    // Surveiller les changements de route
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url.split('?')[0].split('/').pop() || '';


      this.updatePageName();
    });
  }

  updatePageName() {
    switch (this.currentRoute) {
      case 'auth':
        this.pageName = 'Se connecter';
        break;
      case 'register':
        this.pageName = 'S\'inscrire';
        break;
      case 'id-oublie':
        this.pageName = 'ID Oublié';
        break;
      case 'spaces':
        this.pageName = 'Espaces';
        break;
      
      default:
        this.pageName = 'Accueil';
    }
  }
  


  
}