import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../services/alert-notif/notification.service';
import { PasswordRecoveryService } from '../../services/password-recovery/password-recovery.service';

/** New password, reached from the link in the reset e-mail (?token=…). */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatIcon, MatProgressSpinner],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly passwordService = inject(PasswordRecoveryService);
  private readonly notificationService = inject(NotificationService);

  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  showPassword = false;
  errorMessage: string | null = null;

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    if (!this.token) {
      this.notificationService.showError('Lien invalide');
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    this.errorMessage = null;
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }
    this.isLoading = true;
    this.passwordService.resetPassword(this.token, this.newPassword, this.confirmPassword).subscribe({
      next: () => {
        this.notificationService.showSuccess('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // the backend sends { error: "…" } (e.g. expired or invalid link)
        this.errorMessage = err.error?.error || err.error?.message || 'Erreur inattendue';
        this.isLoading = false;
      }
    });
  }
}
