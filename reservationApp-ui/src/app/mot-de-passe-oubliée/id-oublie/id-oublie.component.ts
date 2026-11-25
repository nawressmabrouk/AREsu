import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { PasswordRecoveryService } from '../../services/password-recovery/password-recovery.service';

/** "Mot de passe oublié": asks for the e-mail address and sends a reset link. */
@Component({
  selector: 'app-id-oublie',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIcon, MatProgressSpinner],
  templateUrl: './id-oublie.component.html',
  styleUrls: ['./id-oublie.component.scss']
})
export class IdOublieComponent {
  private readonly passwordRecoveryService = inject(PasswordRecoveryService);

  email = '';
  isLoading = false;
  sent = false;
  errorMessage: string | null = null;

  onSubmit() {
    this.errorMessage = null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.errorMessage = 'Veuillez entrer une adresse e-mail valide.';
      return;
    }
    this.isLoading = true;
    this.passwordRecoveryService.sendPasswordResetEmail(this.email.trim()).subscribe({
      next: () => {
        this.isLoading = false;
        this.sent = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Erreur lors de l\'envoi du lien de réinitialisation.';
      }
    });
  }
}
