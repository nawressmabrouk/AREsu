import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../services/alert-notif/notification.service';
import { AuthService } from '../services/auth/auth.service';

/** Login page. Registration has its own page (/register). */
@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIcon, MatProgressSpinner],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  isLoading = false;
  showPassword = false;
  loginErrorMessage: string | null = null;

  loginData = {
    email: '',
    password: ''
  };

  onLoginSubmit(event: Event) {
    event.preventDefault();
    this.loginErrorMessage = null;
    if (!this.validateLogin()) return;

    this.isLoading = true;
    this.authService.login(this.loginData.email.trim(), this.loginData.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.handleLoginSuccess();
      },
      error: (err) => this.handleLoginError(err)
    });
  }

  private validateLogin(): boolean {
    if (!this.loginData.email || !this.loginData.password) {
      this.loginErrorMessage = 'Veuillez remplir tous les champs';
      return false;
    }
    if (!this.isValidEmail(this.loginData.email)) {
      this.loginErrorMessage = 'Veuillez entrer une adresse e-mail valide';
      return false;
    }
    return true;
  }

  // Back to the page that required the login (returnUrl), otherwise the landing page of the role
  private handleLoginSuccess() {
    const token = this.authService.getToken();
    if (!token) {
      this.notificationService.showError('Erreur d\'authentification : jeton non reçu');
      return;
    }
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/login')) {
      this.router.navigateByUrl(returnUrl);
      return;
    }
    const decoded = this.authService.decodeToken(token);
    const role = Array.isArray(decoded?.roles) ? decoded.roles[0] : decoded?.roles;
    this.router.navigate([this.authService.homeRouteFor(role)]);
  }

  private handleLoginError(err: any) {
    this.isLoading = false;
    if (err.status === 401) {
      this.loginErrorMessage = 'E-mail ou mot de passe incorrect';
    } else if (err.status === 403 && err.error?.error) {
      // e.g. account not activated yet
      this.loginErrorMessage = err.error.error;
    } else if (err.status === 0) {
      this.loginErrorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    } else {
      this.loginErrorMessage = 'Erreur lors de la connexion';
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }
}
