
import { Component, EventEmitter, HostListener, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { faUser, faEdit, faCalendarTimes ,faLock, faSignOutAlt, faEye, faEyeSlash , faCalendar , faKey   } from '@fortawesome/free-solid-svg-icons';
import { UserService } from '../../../services/user/user.service';

import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { catchError, of } from 'rxjs';
import { NotificationComponent } from '../../../alert-notif/notification.component';
import { NotificationService } from '../../../services/alert-notif/notification.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [ CommonModule , FormsModule , FontAwesomeModule , NotificationComponent
  ],
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  @ViewChild('profileDropdown') profileDropdown!: ElementRef;
  @Input() user: any; // Input for user data
  @Output() profileUpdated = new EventEmitter<any>();
  
  // Icons
  faUser = faUser;
  faEdit = faEdit;
  faCalendarTimes = faCalendarTimes;
  faKey = faKey ;
  faLock = faLock;
  faSignOutAlt = faSignOutAlt;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faCalendar = faCalendar ;
  // UI states
  showDropdown = false;
  showProfileModal = false;
  showEditModal = false;
  showPasswordModal = false;
  showReservationsModal = false;
  showLogoutModal = false;
  // Password visibility
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // Form data
  profileData: any;
  editData: any = {};
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // propriétés pour consulter réservations 
  reservations: any[] = [];
  loadingReservations = false;
  errorReservations = '';


  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router , 
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  // Load user profile
  loadProfile(): void {
    this.userService.getProfile().pipe(
      catchError(err => {
        console.error('Erreur lors du chargement du profil:', err);
        if (err.status === 401 || err.status === 403) {
          this.handleAuthError();
        }
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        if (data) {
          this.profileData = data;
          this.resetEditForm();
        } else {
          console.error('Aucune donnée reçue');
        }
      },
      error: (err) => {
        console.error('Erreur dans subscribe:', err);
      }
    });
  }
  // Toggle profile dropdown
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.profileDropdown.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  // Open profile view modal
  openProfileModal(): void {
    this.showProfileModal = true;
    this.showDropdown = false;
  }

  // Open profile edit modal
  openEditModal(): void {
    this.showEditModal = true;
    this.showProfileModal = false;
  }

  // Open password change modal
  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.showDropdown = false;
  }

  // Open reservations modal (for demandeur only)
  openReservationsModal(): void {
       this.showReservationsModal = true;
    this.showDropdown = false;
    this.loadReservations();
  }
  // Modifiez la méthode logout() existante pour :
openLogoutModal(): void {
  this.showLogoutModal = true;
  this.showDropdown = false;
}

closeLogoutModal(): void {
  this.showLogoutModal = false;
}


  // Close all modals
  closeModal(): void {
    this.showProfileModal = false;
    this.showEditModal = false;
    this.showPasswordModal = false;
    this.showReservationsModal = false;
    this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
  }

  // Reset edit form with current profile data
  resetEditForm(): void {
    this.editData = {
      nom: this.profileData?.nom || '',
      prenom: this.profileData?.prenom || '',
      email: this.profileData?.email || '',
      numTel: this.profileData?.numTel || '',
      fonction: this.profileData?.fonction || '',
      nomEtablissement: this.profileData?.nomEtablissement || '',
      structure: this.profileData?.structure || '',
      linkedInLink: this.profileData?.linkedInLink || ''
    };
  }

  // modifier profil 
  saveProfile(): void {
    // Vérification des champs obligatoires
    const requiredFields = {
      'Nom': this.editData.nom,
      'Prénom': this.editData.prenom,
      'Téléphone': this.editData.numTel,
      'Fonction': this.editData.fonction,
      'Établissement': this.editData.nomEtablissement,
      'Structure': this.editData.structure
    };
  
    // Trouver le premier champ vide
    const emptyField = Object.entries(requiredFields).find(([_, value]) => !value);
  
    if (emptyField) {
      const [fieldName, _] = emptyField;
      this.notificationService.showError(`Le champ ${fieldName} est obligatoire !`);
      return;
    }
  
   
  
    console.log('Données avant envoi:', JSON.stringify(this.editData, null, 2));
  
    this.userService.updateProfile(this.editData).subscribe({
      next: (updatedProfile) => {
        console.log('Réponse complète du backend:', updatedProfile);
        if (updatedProfile) {
          this.profileData = { ...this.profileData, ...updatedProfile };
          this.profileUpdated.emit(this.profileData);
          this.notificationService.showSuccess('Profil mis à jour avec succès!');
          this.loadProfile();
        } else {
          console.error('Réponse vide du backend');
          this.notificationService.showError('Le serveur a répondu sans données');
        }
      },
      error: (err) => {
        console.error('Erreur détaillée:', err);
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
// modification de mot de passe
changePassword(): void {
  


  if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
    this.notificationService.showError('Les nouveaux mots de passe ne correspondent pas!');
    return;
  }

  this.userService.changePassword({
    oldPassword: this.passwordData.oldPassword,
    newPassword: this.passwordData.newPassword
  }).subscribe({
    next: (response) => {
      console.log('Password change successful:', response);
      this.notificationService.showSuccess('Mot de passe changé avec succès!');
      
      this.passwordData = { oldPassword: '', newPassword: '', confirmPassword: '' };
    },
    error: (err) => {
      console.error('Full error details:', err);
      let errorMessage = 'Erreur lors du changement de mot de passe';
      
      if (err.status === 400) {
        errorMessage = 'Mot de passe ancien est incorrecte';
      } else if (err.error instanceof ErrorEvent) {
        errorMessage = `Erreur client: ${err.error.message}`;
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
    error: (err) => {
      this.errorReservations = 'Erreur lors du chargement des réservations';
      this.loadingReservations = false;
    }
  });
}

canCancel(reservation: any): boolean {
  return reservation.statut === 'EN_ATTENTE';
}
//annuler réservation
onCancelReservation(reservationId: string): void {
  if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
    this.userService.cancelReservation(reservationId).subscribe({
      next: (response) => {
        this.loadReservations();
        this.notificationService.showSuccess(response.message || 'Réservation annulée avec succès');
      },
      error: (err) => {
        this.notificationService.showError(err.message || 'Échec de l\'annulation');
      }
    });
  }
}

  // Logout
  logout(): void {
    this.userService.logout().subscribe({
      next: () => {
        // Force la suppression complète du cache
       
        window.sessionStorage.clear();
        window.location.href = '/login'; // Redirection FULL PAGE
        // Désactive le cache navigateur
        this.router.navigateByUrl('/login', { 
          replaceUrl: true,
          state: { noCache: true } 
        });
        
        // Supprime l'historique
        history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
          history.pushState(null, '', window.location.href);
        });
      },
      error: () => {
        window.location.href = '/login'; // Fallback
      }
    });
  }

  

  private handleAuthError(): void {
    this.authService.logout(); 
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }
  

  // Check if user is demandeur
  isDemandeur(): boolean {
    const role = this.profileData?.role?.toUpperCase();
    return role === 'DEMANDEUR_INTERNE' || role === 'DEMANDEUR_EXTERNE';
  }
}            



