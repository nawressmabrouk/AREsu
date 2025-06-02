import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBriefcase,
  faBuilding,
  faDoorOpen,
  faEnvelope,
  faKey,
  faLink,
  faLock,
  faPhone,
  faSignInAlt,
  faUniversity,
  faUser, faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { NotificationComponent } from '../alert-notif/notification.component';
import { ChatComponent } from '../chatbot/chatbot.component';
import { NotificationService } from '../services/alert-notif/notification.service';
import { AuthService } from '../services/auth/auth.service';
import { RegistrationService } from '../services/auth/register.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FontAwesomeModule,
    FormsModule,
    NotificationComponent , ChatComponent
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent {
  // Icons
  faKey = faKey;
  faDoorOpen = faDoorOpen;
  faUser = faUser;
  faSignInAlt = faSignInAlt;
  faUserPlus = faUserPlus;
  faEnvelope = faEnvelope;
  faBriefcase = faBriefcase;
  faPhone = faPhone;
  faBuilding = faBuilding;
  faUniversity = faUniversity;
  faLink = faLink;
  faLock = faLock;

  // Form states
  isAccountPage: boolean = false;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  loginErrorMessage: string | null = null;
  confirmPassword: string = '';

  // Form data models
  registerData = {
    nom: '',
    prenom: '',
    email: '',
    fonction: '',
    numTel: '',
    nomEtablissement: '',
    linkedin: '',
    structure: '',
    role: '',
    password: '', 
     isPartenaire: null
  };

  loginData = {
    email: '',
    password: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private registrationService: RegistrationService,
    private notificationService: NotificationService
  ) {}

  // === UI CONTROL METHODS ===
  // Toggle between login and registration views
  toggleView() {
    this.isAccountPage = !this.isAccountPage;
    this.resetFormStates();
  }

  // Reset form states
  private resetFormStates() {
    this.errorMessage = null;
    this.loginErrorMessage = null;
    this.isLoading = false;
  }

  // === LOGIN METHODS ===
  // Login Submit
  onLoginSubmit(event: Event) {
    event.preventDefault();
    this.loginErrorMessage = null;

    if (!this.validateLogin()) return;

    this.isLoading = true;

    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.handleLoginSuccess();
      },
      error: (err) => {
        this.handleLoginError(err);
      }
    });
  }

  // Validate login form
  private validateLogin(): boolean {
    if (!this.loginData.email || !this.loginData.password) {
      this.notificationService.showError('Veuillez remplir tous les champs');
      return false;
    }

    if (!this.isValidEmail(this.loginData.email)) {
      this.notificationService.showError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  }

  // Handle login success and redirect based on user role
  private handleLoginSuccess() {
    const token = this.authService.getToken();
    if (token) {
      const decoded = this.authService.decodeToken(token);
      this.redirectUserByRole(decoded?.roles);
    } else {
      this.notificationService.showError('Erreur d\'authentification : jeton non reçu');
    }
  }

  // Handle login error
  private handleLoginError(err: any) {
    this.isLoading = false;
    if (err.status === 401) {
      this.notificationService.showError('Email ou mot de passe incorrect');
    } else if (err.status === 0) {
      this.notificationService.showError('Impossible de se connecter au serveur');
    } else {
      this.notificationService.showError('Erreur lors de la connexion');
    }
  }

  // === REGISTRATION METHODS ===
  // Registration Submit
onRegisterSubmit(event: Event) {
  event.preventDefault();
  this.errorMessage = null;

  if (!this.validateRegistration()) return;

  this.isLoading = true;

  this.registrationService.register(this.registerData).subscribe({
    next: () => {
      this.isLoading = false;
      this.notificationService.showSuccess(
        'Inscription réussie ! Veuillez vérifier votre email pour activer votre compte.'
      );
      this.toggleView();
    },
    error: (error) => {
      this.handleRegistrationError(error);
    }
  });
}

  // Validate registration form
  private validateRegistration(): boolean {
    if (Object.values(this.registerData).some(value => !value)) {
      this.notificationService.showError('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    if (!this.isValidEmail(this.registerData.email)) {
      this.notificationService.showError('Veuillez entrer une adresse email valide');
      return false;
    }

    if (this.registerData.linkedin && !this.isValidLinkedInUrl(this.registerData.linkedin)) {
      this.notificationService.showError('Veuillez entrer une URL LinkedIn valide');
      return false;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.notificationService.showError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (!this.isPasswordStrong(this.registerData.password)) {
      this.notificationService.showError('Le mot de passe doit contenir au moins 8 caractères avec majuscule, chiffre et symbole');
      return false;
    }

    return true;
  }

  // Handle registration success or error
  private handleRegistrationError(error: any) {
    this.isLoading = false;
    if (error?.error?.includes('email')) {
      this.notificationService.showError('Cet email existe déjà');
    } else {
      this.notificationService.showError('Erreur lors de l\'inscription');
    }
  }

  // === VALIDATION HELPERS ===

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  private isValidLinkedInUrl(url: string): boolean {
    if (!url) return true;
    const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/;
    return linkedInRegex.test(url);
  }

  private isPasswordStrong(password: string): boolean {
    return password.length >= 8 && 
           this.hasUpperCase(password) && 
           this.hasNumber(password) && 
           this.hasSymbol(password);
  }

  private hasUpperCase(text: string): boolean {
    return /[A-Z]/.test(text);
  }

  private hasNumber(text: string): boolean {
    return /[0-9]/.test(text);
  }

  private hasSymbol(text: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(text);
  }

  // === REDIRECTION BASED ON ROLE ===
  private redirectUserByRole(roles: any): void {
    let normalizedRole = '';
    
    if (Array.isArray(roles)) {
      normalizedRole = roles[0].replace('ROLE_', '').toLowerCase();
    } else if (typeof roles === 'string') {
      normalizedRole = roles.replace('ROLE_', '').toLowerCase();
    }

    const roleRoutes: { [key: string]: string } = {
      'demandeur_interne': '/spaces',
      'demandeur_externe': '/spaces',
      'secretaire_generale': '/secretary',
      'admin': '/admin',
      'responsable_salle': '/room-manager',
      'super_admin': '/super-admin/dashboard',
    };

    const targetRoute = roleRoutes[normalizedRole] || '/unauthorized';
    this.router.navigate([targetRoute]);
  }
}


