import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PasswordRecoveryService } from '../../services/password-recovery/password-recovery.service';
import { NotificationComponent } from '../../alert-notif/notification.component';
import { NotificationService } from '../../services/alert-notif/notification.service';
import { CommonModule } from '@angular/common';
import { faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {  ViewChild, ElementRef } from '@angular/core';
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule , NotificationComponent , CommonModule , FontAwesomeModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})

export class ResetPasswordComponent implements OnInit {
  @ViewChild('newPassInput') newPassInput!: ElementRef;
  @ViewChild('confirmPassInput') confirmPassInput!: ElementRef;
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
showPassword = false;
showConfirmPassword = false;
faLock = faLock;
faEye = faEye;
faEyeSlash = faEyeSlash;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private passwordService: PasswordRecoveryService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'];
    
    if (!this.token) {
      this.notificationService.showError('Lien invalide');
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.notificationService.showError('Les mots de passe ne correspondent pas');
      return;
    }

    this.isLoading = true;

    this.passwordService.resetPassword(this.token, this.newPassword, this.confirmPassword)
      .subscribe({
        next: () => {
          this.notificationService.showSuccess('Mot de passe réinitialisé !');
          this.router.navigate(['/auth']);
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Erreur inattendue');
          this.isLoading = false;
        }
      });
  }
 

  togglePasswordVisibility(inputField: HTMLInputElement) {
    if (inputField === this.newPassInput.nativeElement) {
      this.showPassword = !this.showPassword;
      inputField.type = this.showPassword ? 'text' : 'password';
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
      inputField.type = this.showConfirmPassword ? 'text' : 'password';
    }
  }
  onPasswordInput() {
    // Déclenche la détection de changement
  }
}