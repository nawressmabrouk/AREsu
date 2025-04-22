// home.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faHome,  
  faArrowRight    // Fichier avec stylo
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  faHome = faHome;
  constructor(private router: Router) {}
  
  navigateToLogin() {
    this.router.navigate(['/navbar/auth']);
  }

  navigateToRegister() {
    this.router.navigate(['/navbar/register']);
  }

}
