import { Component } from '@angular/core';
import { Router, RouterModule, } from '@angular/router';
import { faBriefcase, faBuilding, faEnvelope, faLink, faLock, faPhone, faUniversity, faUser } from '@fortawesome/free-solid-svg-icons';
import { RegistrationService } from './services/register.service';
import { ViewChild, ElementRef } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
;
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FontAwesomeModule,RouterModule ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  

  faUser = faUser;
  faEnvelope = faEnvelope;
  faBriefcase = faBriefcase;
  faPhone = faPhone;
  faBuilding = faBuilding;
  faUniversity = faUniversity;
  faLink= faLink;
  faLock = faLock ;

  constructor(private router: Router, private registrationService: RegistrationService) {}
 

  onSubmit(
    firstName: string,
    lastName: string,
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
    if (!confirmPassword) {
      alert('Veuillez confirmer votre mot de passe');
      return;
    }
  
    if (!this.passwordsMatch(password, confirmPassword)) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!this.isPasswordStrong(password)) {
      alert('Le mot de passe doit contenir au moins 8 caractères, dont une majuscule, un chiffre et un symbole.');
      return;
    }
    if (
      firstName && lastName && email && fonction && numTel && nomEtablissement &&
      linkedInLink && structure && (isInterne || isExterne) && password && confirmPassword
    ) {
      const userData = {
        nom: firstName,
        prenom: lastName,
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
        next: (response) => {
          alert('Inscription réussie !');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          console.error(error);
          alert('Erreur lors de l\'inscription.');
        }
      });
    } else {
      alert('Veuillez remplir tous les champs obligatoires.');
    }
  }
  
  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
  
  // Ajoutez cette méthode dans votre classe RegisterComponent
isPasswordStrong(password: string): boolean {
  // Au moins 8 caractères
  if (password.length < 8) {
    return false;
  }

  // Au moins une lettre majuscule
  const hasUpperCase = /[A-Z]/.test(password);
  // Au moins un chiffre
  const hasNumber = /[0-9]/.test(password);
  // Au moins un symbole (vous pouvez ajuster cette regex selon ce que vous considérez comme symbole)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUpperCase && hasNumber && hasSymbol;
}
hasUpperCase(password: string): boolean {
  return /[A-Z]/.test(password);
}

hasNumber(password: string): boolean {
  return /[0-9]/.test(password);
}

hasSymbol(password: string): boolean {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
}
}