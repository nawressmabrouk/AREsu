import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { NotificationComponent } from '../../alert-notif/notification.component';
import { NotificationService } from '../../services/alert-notif/notification.service';
import { PasswordRecoveryService } from '../../services/password-recovery/password-recovery.service';
@Component({
  selector: 'app-id-oublie',
  imports: [FontAwesomeModule, FormsModule , NotificationComponent , CommonModule],
  templateUrl: './id-oublie.component.html',
  styleUrl: './id-oublie.component.scss'
})
export class IdOublieComponent {
  faEnvelope = faEnvelope;
  email: string = '';
  isLoading = false;

  constructor(private router: Router ,  private passwordRecoveryService: PasswordRecoveryService , private notificationService: NotificationService) {}
  


  onSubmit() {
    this.isLoading = true;
    
    this.passwordRecoveryService.sendPasswordResetEmail(this.email).subscribe({
      next: () => {
        this.notificationService.showSuccess(
          "si votre email est enregistrée vous devrez récu Un lien de réinitialisation "
        );
       
      },
      error: (err) => {
        this.notificationService.showError(
          err.error?.message || "Erreur lors de l'envoi du lien de réinitialisation"
        );
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }


}
