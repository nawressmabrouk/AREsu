import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faKey, faSignInAlt, faUser, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    FormsModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  // Icons
  faUser = faUser;
  faKey = faKey;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;

  email: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = null;

    if (this.email && this.password) {
      this.login();
    } else {
      this.errorMessage = "Veuillez remplir tous les champs.";
    }
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }
/*
  login(): void {
    this.isLoading = true;
    const password = this.password;
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.isLoading = false;

        const token = this.authService.getToken();
        if (token) {
          console.log('Connexion réussie.');

          // Decode token to get the role
          const decoded = this.decodeToken(token);
          const roles = decoded?.roles;
          if (roles) {
            this.redirectUserByRole(roles);
          } else {
            this.errorMessage = "Rôle non trouvé dans le token.";
          }
        } else {
          console.log('Échec - Token manquant');
          this.errorMessage = "Erreur d'authentification : jeton non reçu après la connexion.";
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Login error:', err);

        if (err.status === 401) {
          this.errorMessage = "Email ou mot de passe incorrect.";
        } else if (err.status === 0) {
          this.errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion.";
        } else {
          this.errorMessage = "Une erreur s'est produite lors de la connexion.";
        }
      }
    });
  }*/
    login(): void {
      this.isLoading = true;
      this.errorMessage = null;
    
      this.authService.login(this.email, this.password).subscribe({
        next: (response) => {
          this.isLoading = false;
          const token = this.authService.getToken();
          
          if (token) {
            const decoded = this.authService.decodeToken(token); // Use service method
            const roles = decoded?.roles;
            
            if (roles) {
              this.redirectUserByRole(roles);
            } else {
              this.errorMessage = "Rôle non trouvé dans le token.";
              this.authService.logout().subscribe();
            }
          } else {
            this.errorMessage = "Erreur d'authentification : jeton non reçu.";
          }
        },
        error: (err) => {
          this.handleLoginError(err);
        }
      });
    }
    
    
    
    
    
    private handleLoginError(err: any): void {
      if (err.status === 401) {
        this.errorMessage = "Email ou mot de passe incorrect.";
      } else if (err.status === 0) {
        this.errorMessage = "Impossible de se connecter au serveur.";
      } else {
        this.errorMessage = "Erreur inconnue lors de la connexion.";
      }
    }
/*
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }*/

  private redirectUserByRole(roles: any): void {
    let normalizedRole = '';
  
    if (Array.isArray(roles)) {
      // Gérer le cas où plusieurs rôles sont envoyés
      normalizedRole = roles[0].replace('ROLE_', '').toLowerCase(); // Prendre le premier rôle et supprimer "ROLE_"
    } else if (typeof roles === 'string') {
      // Si un seul rôle est renvoyé
      normalizedRole = roles.replace('ROLE_', '').toLowerCase(); // Supprimer "ROLE_" et mettre en minuscule
    }
  
    const roleRoutes: { [key: string]: string } = {
      'demandeur_interne': '/spaces',    // Fixed typo (added missing "r")
      'demandeur_externe': '/spaces',
      'secretaire_generale': '/secretary',
      'admin': '/admin',
      'responsable_salle': '/room-manager'
    };
  
    const targetRoute = roleRoutes[normalizedRole] || '/unauthorized';
  
    console.log(`Redirection vers: ${targetRoute} (rôle: ${roles})`);
    this.router.navigate([targetRoute]);
  }
  
}
