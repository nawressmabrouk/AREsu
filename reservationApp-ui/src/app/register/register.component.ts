import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faBriefcase, faBuilding, faEnvelope, 
  faLink, faLock, faPhone, faUniversity, faUser 
} from '@fortawesome/free-solid-svg-icons';
import { RegistrationService } from '../services/auth/register.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,    // Required for *ngIf and other common directives
    FormsModule,     // Required for template-driven forms
    RouterModule,    // Required for routerLink
    FontAwesomeModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  // Icons
  faUser = faUser;
  faEnvelope = faEnvelope;
  faBriefcase = faBriefcase;
  faPhone = faPhone;
  faUniversity = faUniversity;
  faLink = faLink;
  faBuilding = faBuilding;
  faLock = faLock;

  // Form state
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private registrationService: RegistrationService
  ) {}

  onSubmit(
    lastName: string,
    firstName: string,
    email: string,
    fonction: string,
    numTel: string,
    nomEtablissement: string,
    linkedInLink: string,
    structure: string,
    isInterne: boolean,
    isExterne: boolean,
    password: string,
    confirmPassword: string | undefined,
    event: Event
  ) {
    event.preventDefault();
    this.errorMessage = null;

    // Validate form
    if (!confirmPassword) {
      this.errorMessage = 'Veuillez confirmer votre mot de passe';
      return;
    }

    if (!this.passwordsMatch(password, confirmPassword)) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (!this.isPasswordStrong(password)) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, un chiffre et un symbole';
      return;
    }

    if (!firstName || !lastName || !email || !fonction || !numTel || 
        !nomEtablissement || !linkedInLink || !structure || 
        (!isInterne && !isExterne) || !password) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.isLoading = true;

    const userData = {
      nom: lastName,
      prenom: firstName,
      email: email,
      numTel: numTel,
      role: isInterne ? 'DEMANDEUR_INTERNE' : 'DEMANDEUR_EXTERNE',
      fonction: fonction,
      nomEtablissement: nomEtablissement,
      password: password,
      structure: structure,
      linkedin: linkedInLink,
    };

    this.registrationService.register(userData).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Inscription réussie !');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        
        if (error?.error?.includes?.('email')) {
          this.errorMessage = 'Cet email existe déjà. Veuillez utiliser un autre email.';
        } else {
          this.errorMessage = error?.error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.';
        }
      }
    });
  }

  private passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  private isPasswordStrong(password: string): boolean {
    return password.length >= 8 && 
           this.hasUpperCase(password) && 
           this.hasNumber(password) && 
           this.hasSymbol(password);
  }

  public hasUpperCase(text: string): boolean {
    return /[A-Z]/.test(text);
  }

  public hasNumber(text: string): boolean {
    return /[0-9]/.test(text);
  }

  public hasSymbol(text: string): boolean {
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(text);
  }
}