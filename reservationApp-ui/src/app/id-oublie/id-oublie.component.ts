import { Component } from '@angular/core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

@Component({
  selector: 'app-id-oublie',
  imports: [FontAwesomeModule, FormsModule],
  templateUrl: './id-oublie.component.html',
  styleUrl: './id-oublie.component.scss'
})
export class IdOublieComponent {
  faEnvelope = faEnvelope;
  email: string = '';
  constructor(private router: Router) {}
  onSubmit() {
    console.log('Email submitted:', this.email); // <-- Now you can access this.email
    // Ajoutez ici la logique pour traiter la récupération d'ID
    // Par exemple, rediriger l'utilisateur après la soumission
    this.router.navigate(['/auth/login']); // Redirige vers la page de connexion
  }
}
