import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../services/alert-notif/notification.service';
import { RegistrationService } from '../services/auth/register.service';
import { EtablissementService } from '../services/etablissement/etablissement.service';

/** Account creation for requesters (internal / external). */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIcon,
    MatRadioModule, MatAutocompleteModule, MatProgressSpinner,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  private readonly registrationService = inject(RegistrationService);
  private readonly notificationService = inject(NotificationService);
  private readonly etablissementService = inject(EtablissementService);

  isLoading = false;
  registered = false;
  registeredEmail = '';
  errorMessage: string | null = null;
  confirmPassword = '';
  showPassword = false;
  etablissementNames: string[] = [];

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
    isPartenaire: null as boolean | null
  };

  ngOnInit() {
    // Suggestions for the "Établissement" field (free text is still allowed)
    this.etablissementService.getAllEtablissements().subscribe({
      next: list => this.etablissementNames = list.map(e => e.nom).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr')),
      error: () => this.etablissementNames = []
    });
  }

  get filteredEtablissements(): string[] {
    const q = this.normalize(this.registerData.nomEtablissement);
    return this.etablissementNames.filter(n => this.normalize(n).includes(q)).slice(0, 8);
  }

  get passwordRules() {
    const p = this.registerData.password;
    return [
      { ok: p.length >= 8, label: '8 caractères minimum' },
      { ok: this.hasUpperCase(p), label: 'Une majuscule' },
      { ok: this.hasNumber(p), label: 'Un chiffre' },
      { ok: this.hasSymbol(p), label: 'Un symbole' },
    ];
  }

  onRegisterSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = null;
    if (!this.validateRegistration()) return;

    this.isLoading = true;
    // Prepare the data in the format expected by the backend
    const registrationData = {
      nom: this.registerData.nom.trim(),
      prenom: this.registerData.prenom.trim(),
      email: this.registerData.email.trim(),
      fonction: this.registerData.fonction,
      numTel: this.registerData.numTel,
      nomEtablissement: this.registerData.nomEtablissement,
      // the backend field is linkedInLink (the old "linkedin" key was ignored)
      linkedInLink: this.registerData.linkedin,
      structure: this.registerData.structure,
      role: this.registerData.role,
      password: this.registerData.password,
      isPartenaire: this.registerData.isPartenaire
    };

    this.registrationService.register(registrationData).subscribe({
      next: () => {
        this.isLoading = false;
        this.registeredEmail = registrationData.email;
        this.registered = true;
        this.notificationService.showSuccess('Inscription réussie ! Vérifiez votre e-mail pour activer votre compte.');
        this.resetRegisterForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error === 'Cet email est déjà utilisé'
          ? 'Cette adresse e-mail est déjà utilisée.'
          : 'Erreur lors de l\'inscription. Veuillez réessayer.';
      }
    });
  }

  private resetRegisterForm() {
    this.registerData = {
      nom: '', prenom: '', email: '', fonction: '', numTel: '', nomEtablissement: '',
      linkedin: '', structure: '', role: '', password: '', isPartenaire: null
    };
    this.confirmPassword = '';
  }

  private validateRegistration(): boolean {
    const labels: Record<string, string> = {
      nom: 'Nom', prenom: 'Prénom', email: 'E-mail', fonction: 'Fonction', numTel: 'Téléphone',
      nomEtablissement: 'Établissement', structure: 'Structure', role: 'Type d\'utilisateur', password: 'Mot de passe'
    };
    for (const field of Object.keys(labels)) {
      if (!this.registerData[field as keyof typeof this.registerData]) {
        this.errorMessage = `Le champ « ${labels[field]} » est obligatoire.`;
        return false;
      }
    }
    if (this.registerData.isPartenaire === null) {
      this.errorMessage = 'Veuillez indiquer si vous êtes partenaire de l\'établissement.';
      return false;
    }
    if (!this.isValidEmail(this.registerData.email)) {
      this.errorMessage = 'Veuillez entrer une adresse e-mail valide.';
      return false;
    }
    if (this.registerData.linkedin && !this.isValidLinkedInUrl(this.registerData.linkedin)) {
      this.errorMessage = 'Veuillez entrer une URL LinkedIn valide (linkedin.com/in/… ou /company/…).';
      return false;
    }
    if (!this.isPasswordStrong(this.registerData.password)) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un symbole.';
      return false;
    }
    if (this.registerData.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return false;
    }
    return true;
  }

  // Validation helpers
  isValidEmail(email: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
  }

  private isValidLinkedInUrl(url: string): boolean {
    if (!url) return true;
    return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/.test(url);
  }

  private isPasswordStrong(password: string): boolean {
    return password.length >= 8 && this.hasUpperCase(password) && this.hasNumber(password) && this.hasSymbol(password);
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

  private normalize(s: string): string {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
