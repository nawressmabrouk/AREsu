import { DatePipe } from '@angular/common';
import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { roleLabel } from '../../../layout/nav';
import { AuthService } from '../../../services/auth/auth.service';
import { NotificationService } from '../../../services/alert-notif/notification.service';
import { UserService } from '../../../services/user/user.service';
import { ConfirmService } from '../../ui/confirm-dialog.component';
import { EmptyStateComponent } from '../../ui/empty-state.component';
import { SkeletonComponent } from '../../ui/skeleton.component';
import { hasStatus } from '../../ui/status';
import { StatusBadgeComponent } from '../../ui/status-badge.component';

/** User menu of the top bar: profile, edit, password, my reservations, logout. */
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [
    FormsModule, DatePipe, MatButtonModule, MatIcon, MatMenuModule, MatFormFieldModule, MatInputModule,
    MatRadioModule, StatusBadgeComponent, EmptyStateComponent, SkeletonComponent,
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  @Input() user: any; // Input for user data
  @Output() profileUpdated = new EventEmitter<any>();

  private readonly confirmService = inject(ConfirmService);

  showProfileModal = false;
  showEditModal = false;
  showPasswordModal = false;
  showReservationsModal = false;

  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  saving = false;

  profileData: any;
  editData: any = {};
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  reservations: any[] = [];
  loadingReservations = false;
  errorReservations = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Also shown on public pages (e.g. /spaces): only load the profile when logged in
    if (this.authService.isLoggedIn()) {
      this.loadProfile();
    }
  }

  get initial(): string {
    return (this.profileData?.prenom || this.profileData?.nom || 'U').charAt(0).toUpperCase();
  }

  get displayName(): string {
    const name = [this.profileData?.prenom, this.profileData?.nom].filter(Boolean).join(' ');
    return name || 'Mon compte';
  }

  get roleText(): string {
    return roleLabel(this.profileData?.role) || this.profileData?.role || '';
  }

  loadProfile(): void {
    this.userService.getProfile().pipe(
      catchError(err => {
        if (err.status === 401 || err.status === 403) {
          this.handleAuthError();
        }
        return of(null);
      })
    ).subscribe(data => {
      if (data) {
        this.profileData = data;
        this.resetEditForm();
      }
    });
  }

  openProfileModal(): void {
    this.closeModal();
    this.showProfileModal = true;
  }

  openEditModal(): void {
    this.resetEditForm();
    this.showProfileModal = false;
    this.showEditModal = true;
  }

  openPasswordModal(): void {
    this.closeModal();
    this.showPasswordModal = true;
  }

  openReservationsModal(): void {
    this.closeModal();
    this.showReservationsModal = true;
    this.loadReservations();
  }

  @HostListener('document:keydown.escape')
  closeModal(): void {
    this.showProfileModal = false;
    this.showEditModal = false;
    this.showPasswordModal = false;
    this.showReservationsModal = false;
    this.showOldPassword = this.showNewPassword = this.showConfirmPassword = false;
    this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
  }

  resetEditForm(): void {
    this.editData = {
      nom: this.profileData?.nom || '',
      prenom: this.profileData?.prenom || '',
      email: this.profileData?.email || '',
      numTel: this.profileData?.numTel || '',
      fonction: this.profileData?.fonction || '',
      nomEtablissement: this.profileData?.nomEtablissement || '',
      structure: this.profileData?.structure || '',
      linkedInLink: this.profileData?.linkedInLink || '',
      role: this.profileData?.role || ''
    };
  }

  saveProfile(): void {
    const requiredFields = {
      'Nom': this.editData.nom,
      'Prénom': this.editData.prenom,
      'Téléphone': this.editData.numTel,
      'Fonction': this.editData.fonction,
      'Établissement': this.editData.nomEtablissement,
      'Structure': this.editData.structure
    };
    const emptyField = Object.entries(requiredFields).find(([_, value]) => !value);
    if (emptyField) {
      this.notificationService.showError(`Le champ ${emptyField[0]} est obligatoire !`);
      return;
    }

    const dataToSend = {
      ...this.editData,
      role: this.isDemandeur() ? this.editData.role : this.profileData.role
    };
    this.saving = true;
    this.userService.updateProfile(dataToSend).subscribe({
      next: (updatedProfile) => {
        this.saving = false;
        if (updatedProfile) {
          this.profileData = {
            ...this.profileData,
            ...updatedProfile,
            role: updatedProfile.role || this.profileData.role
          };
          this.profileUpdated.emit(this.profileData);
          this.notificationService.showSuccess('Profil mis à jour avec succès !');
          this.closeModal();
          this.loadProfile();
        } else {
          this.notificationService.showError('Le serveur a répondu sans données');
        }
      },
      error: (err) => {
        this.saving = false;
        let errorMessage = 'Erreur lors de la mise à jour du profil';
        if (err.status === 401) {
          errorMessage = 'Session expirée, veuillez vous reconnecter';
          this.handleAuthError();
        } else if (err.status === 403) {
          errorMessage = 'Permission refusée';
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.notificationService.showError(errorMessage);
      }
    });
  }

  changePassword(): void {
    if (!this.passwordData.oldPassword || !this.passwordData.newPassword) {
      this.notificationService.showError('Veuillez remplir tous les champs');
      return;
    }
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.notificationService.showError('Les nouveaux mots de passe ne correspondent pas !');
      return;
    }
    this.saving = true;
    this.userService.changePassword({
      oldPassword: this.passwordData.oldPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.saving = false;
        this.notificationService.showSuccess('Mot de passe changé avec succès !');
        this.closeModal();
      },
      error: (err) => {
        this.saving = false;
        let errorMessage = 'Erreur lors du changement de mot de passe';
        if (err.status === 400) {
          errorMessage = 'Le mot de passe actuel est incorrect';
        } else if (err.error instanceof ErrorEvent) {
          errorMessage = `Erreur client : ${err.error.message}`;
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        }
        this.notificationService.showError(errorMessage);
      }
    });
  }

  private loadReservations(): void {
    this.loadingReservations = true;
    this.errorReservations = '';
    this.userService.getReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.loadingReservations = false;
      },
      error: () => {
        this.errorReservations = 'Erreur lors du chargement des réservations';
        this.loadingReservations = false;
      }
    });
  }

  canCancel(reservation: any): boolean {
    return hasStatus(reservation.statut, 'EN_ATTENTE');
  }

  onCancelReservation(reservationId: string): void {
    this.confirmService.confirm({
      title: 'Annuler la réservation ?',
      message: 'La demande sera annulée et le créneau libéré. Cette action est définitive.',
      confirmLabel: 'Annuler la réservation',
      cancelLabel: 'Garder',
      tone: 'danger',
    }).subscribe(ok => {
      if (!ok) return;
      this.userService.cancelReservation(reservationId).subscribe({
        next: (response) => {
          this.loadReservations();
          this.notificationService.showSuccess(response?.message || 'Réservation annulée avec succès');
        },
        error: (err) => {
          this.notificationService.showError(err.message || 'Échec de l\'annulation');
        }
      });
    });
  }

  openLogoutModal(): void {
    this.confirmService.confirm({
      title: 'Se déconnecter ?',
      message: `Vous êtes connecté en tant que ${this.profileData?.email || 'utilisateur'}.`,
      confirmLabel: 'Se déconnecter',
      icon: 'logout',
    }).subscribe(ok => ok && this.logout());
  }

  logout(): void {
    // Revoke the token on the server, then always clear the local session
    // (the token used to stay in localStorage after logging out).
    const done = () => {
      this.authService.clearAuth();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    };
    this.userService.logout().subscribe({ next: done, error: done });
  }

  private handleAuthError(): void {
    // logout() returns an Observable that was never subscribed: clear the session directly
    this.authService.clearAuth();
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  isDemandeur(): boolean {
    if (!this.profileData?.role) return false;
    const role = this.profileData.role.toUpperCase();
    return role === 'DEMANDEUR_INTERNE' || role === 'DEMANDEUR_EXTERNE';
  }
}
