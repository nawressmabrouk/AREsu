
import { CommonModule } from '@angular/common';
import { Component, OnInit , ViewChild  } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBars,
  faCheckCircle,
  faClock,
  faEye,
  faEyeSlash,
  faHome,
  faKey,
  faSearch, faSpinner,
  faTimesCircle , faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { finalize, forkJoin } from 'rxjs';
import { Reservation, StatusReservation } from '../models/reservation.model';
import { ReservationsCalendarComponent } from '../reservations-calendar/reservations-calendar.component';
import { AuthService } from '../services/auth/auth.service';
import { SecretaryService } from '../services/secretary/secretary.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';
import { UserService } from '../services/user/user.service';
import { User } from '../shared/interfaces/user.model';
@Component({
  selector: 'app-secretary',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FontAwesomeModule,
    ProfileComponent,
    ReservationsCalendarComponent
  ],
  templateUrl: './secretary.component.html',
  styleUrls: ['./secretary.component.scss']
})
export class SecretaryComponent implements OnInit {
     @ViewChild(ReservationsCalendarComponent) calendarComponent!: ReservationsCalendarComponent;
  // Expose enum to template
  StatusReservation = StatusReservation;
 etablissementId: string = '';
  // Font Awesome icons
  faHome = faHome;
  faSearch = faSearch;
  faPageIcon = faArrowRight;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faAccessIcon = faKey;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faBars = faBars;
  faSpinner = faSpinner;
faCalendarAlt = faCalendarAlt ;
  // UI states
 activeTab: StatusReservation = StatusReservation.EN_ATTENTE;
  searchTerm = '';
  currentPageTitle = 'Gestion des Réservations';
  currentPageSubtitle = 'Validation et contrôle des réservations des espaces';
  activeSection: 'access' | 'unseen' | 'seen' | 'calendar' = 'access';
  isSidebarExpanded = false;
  
  // User data
  currentUser = {
    role: 'secretaire',
    nomPrenom: 'Secrétaire Générale',
    email: 'secretaire@universite.tn'
  };

  // Reservation data
  reservationsToHandle: Reservation[] = [];
  reservationsToView: Reservation[] = [];
  viewedReservations: Reservation[] = [];
  approvedReservations: Reservation[] = [];
  rejectedReservations: Reservation[] = [];
  filteredRequests: Reservation[] = [];

  // Stats
  stats = {
    pending: 0,
    approved: 0,
    rejected: 0
  };
// Ajoutez cette propriété avec les autres propriétés de la classe
approvedEquipment: { [reservationId: string]: string[] } = {};
  // Loading states
loading: {
  toHandle: boolean;
  toView: boolean;
  viewed: boolean;
  approved: boolean;
  rejected: boolean;
  [key: string]: boolean; // Add index signature to allow dynamic keys
} = {
  toHandle: false,
  toView: false,
  viewed: false,
  approved: false,
  rejected: false
};
  constructor(
    private router: Router,
    private authService: AuthService,
    private secretaryService: SecretaryService , private userSvc :UserService
  ) {}

  ngOnInit(): void {
    
    this.loadInitialData();
  }

private loadInitialData(): void {
  this.userSvc.getProfile().subscribe({
    next: (profile: User) => {
      console.log('Full profile structure:', profile);
      
      // Temporary fallback - remove after backend fix
      const effectiveEtabId = profile.etablissementId || '68036ba5bea561813e4008f7';
      
      if (!effectiveEtabId) {
        console.error('No etablissementId available');
        alert('Votre compte n\'est pas associé à un établissement');
        return;
      }
      
      this.etablissementId = effectiveEtabId;
      console.log('Using establishment ID:', this.etablissementId);
      
      // Load reservation data
      forkJoin([
        this.loadToHandleReservations(),
        this.loadToViewReservations(),
        this.loadViewedReservations()
      ]).subscribe();
    },
    error: (err) => {
      console.error('Error loading profile:', err);
      alert('Erreur de chargement du profil');
    }
  });
}



private updateFilteredRequests(): void {
  switch(this.activeTab) {
    case StatusReservation.EN_ATTENTE: 
      this.filteredRequests = this.reservationsToHandle.filter(r => 
        r.statut === StatusReservation.EN_ATTENTE
      );
      break;
    case StatusReservation.ACCEPTEE:
      this.filteredRequests = this.approvedReservations;
      break;
    case StatusReservation.REFUSEE:
      this.filteredRequests = this.rejectedReservations;
      break;
    default:
      this.filteredRequests = [];
  }
}

  private loadToHandleReservations(): void {
    this.loading.toHandle = true;
    this.secretaryService.getToHandleReservations().subscribe({
      next: (reservations) => {
        this.reservationsToHandle = reservations;
        this.stats.pending = reservations.filter(r => r.statut === StatusReservation.EN_ATTENTE).length;
        this.updateFilteredRequests();
        this.loading.toHandle = false;
      },
      error: (err) => {
        console.error('Error loading reservations to handle:', err);
        this.loading.toHandle = false;
      }
    });
  }

  private loadToViewReservations(): void {
    this.loading.toView = true;
    this.secretaryService.getToViewReservations().subscribe({
      next: (reservations) => {
        this.reservationsToView = reservations;
        this.loading.toView = false;
      },
      error: (err) => {
        console.error('Error loading reservations to view:', err);
        this.loading.toView = false;
      }
    });
  }

  private loadViewedReservations(): void {
    this.loading.viewed = true;
    this.secretaryService.getViewedReservations().subscribe({
      next: (reservations) => {
        console.log('Viewed reservations:', reservations); 
        this.viewedReservations = reservations;
        this.loading.viewed = false;
      },
      error: (err) => {
        console.error('Error loading viewed reservations:', err);
        this.loading.viewed = false;
      }
    });
  }

private loadApprovedReservations(): void {
  this.loading.approved = true;
  this.secretaryService.getReservationsByStatus(StatusReservation.ACCEPTEE)
    .subscribe({
      next: (reservations) => {
        this.approvedReservations = reservations.filter(r => 
        r.statut === StatusReservation.ACCEPTEE // ✅ Filtre principal sur le statut
        );
        this.stats.approved = this.approvedReservations.length;
        this.updateFilteredRequests();
      },
      error: (err) => console.error('Error loading approved:', err)
    });
}

private loadRejectedReservations(): void {
  this.loading.rejected = true;
  this.secretaryService.getReservationsByStatus(StatusReservation.REFUSEE)
    .subscribe({
      next: (reservations) => {
        this.rejectedReservations = reservations.filter(r => 
          r.DecideePar === 'SecretaireGenerale' && r.vueParSecretaire
        );
        this.stats.rejected = this.rejectedReservations.length;
        this.updateFilteredRequests();
      },
      error: (err) => console.error('Error loading rejected:', err)
    });
}

setActiveTab(tab: StatusReservation): void {
  this.activeTab = tab;
  this.searchTerm = '';
  
  if (tab === StatusReservation.ACCEPTEE) {
    this.loadAcceptedReservations();
  } else if (tab === StatusReservation.REFUSEE) {
    this.loadRefusedReservations();
  } else {
    this.loadToHandleReservations();
  }
}

  markAsSeen(reservation: Reservation): void {
    this.secretaryService.viewReservation(reservation.id).subscribe({
      next: () => {
        this.loadToViewReservations();
        this.loadViewedReservations();
      },
      error: (err) => console.error('Error marking as seen:', err)
    });
  }

approveRequest(reservation: Reservation): void {
  // Get approved equipment for this reservation
  const approvedEquipments = this.approvedEquipment[reservation.id] || [];
  
  // Confirm if no equipment is selected
  if (approvedEquipments.length === 0) {
    if (!confirm('Aucun équipement sélectionné. Voulez-vous accepter sans équipement ?')) {
      return;
    }
  }

  // Show loading state
  this.loading['approving_' + reservation.id] = true;

  this.secretaryService.makeDecision(
    reservation.id, 
    true,
    approvedEquipments
  ).pipe(
    finalize(() => {
      delete this.loading['approving_' + reservation.id];
    })
  ).subscribe({
    next: () => {
      // Clean up and refresh data
      delete this.approvedEquipment[reservation.id];
      
      // Refresh all relevant lists AND the calendar
      forkJoin([
        this.loadToHandleReservations(),
        this.loadApprovedReservations(),
        this.loadViewedReservations()
      ]).subscribe(() => {
        // Refresh the calendar after lists are loaded
        this.calendarComponent?.loadSlots();
      });
      
      // Show success message
      alert('Réservation approuvée avec succès');
    },
    error: (err) => {
      console.error('Erreur lors de l\'approbation:', err);
      const errorMsg = err.error?.erreur || err.message || 'Une erreur est survenue';
      alert(`Échec de l'approbation: ${errorMsg}`);
    }
  });
}
rejectRequest(reservation: Reservation): void {
  this.secretaryService.makeDecision(reservation.id, false).subscribe({
    next: () => {
      delete this.approvedEquipment[reservation.id]; // Nettoyage des équipements
      this.loadToHandleReservations();
      this.loadRejectedReservations();
      this.loadViewedReservations();
    },
    error: (err) => console.error('Error rejecting reservation:', err)
  });
}
switchSection(section: 'access' | 'unseen' | 'seen' | 'calendar'): void {
  this.activeSection = section;
  this.searchTerm = '';
  
  switch (section) {
    case 'access':
      this.currentPageTitle = 'Gestion des Réservations';
      this.currentPageSubtitle = 'Validation et contrôle des réservations des espaces';
      break;
    case 'unseen':
      this.currentPageTitle = 'Demandes non vues';
      this.currentPageSubtitle = 'Liste des demandes des espaces non encore consultées';
      break;
    case 'seen':
      this.currentPageTitle = 'Demandes déjà vues';
      this.currentPageSubtitle = 'Liste des demandes des espaces déjà consultées';
      break;
    case 'calendar':
      this.currentPageTitle = 'Calendrier des Réservations';
      this.currentPageSubtitle = 'Visualisation des réservations par calendrier';
      break;
  }
}

  toggleEquipment(reservation: Reservation, equipment: string): void {
    const index = reservation.equipements.indexOf(equipment);
    if (index === -1) {
      reservation.equipements.push(equipment);
    } else {
      reservation.equipements.splice(index, 1);
    }
  }

  getStatusCircleClass(statut: StatusReservation): string {
    const baseClass = 'status-circle';
    switch (statut) {
      case StatusReservation.ACCEPTEE: return `${baseClass} approved`;
      case StatusReservation.REFUSEE: return `${baseClass} rejected`;
      case StatusReservation.EN_ATTENTE: return `${baseClass} pending`;
      default: return baseClass;
    }
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  onSearch(): void {
    // Implement search logic if needed
  }

  private calculateStats(): void {
  this.stats = {
    pending: this.reservationsToHandle.filter(r => r.statut === StatusReservation.EN_ATTENTE).length,
    approved: this.approvedReservations.length,
    rejected: this.rejectedReservations.length
  };
}


// Ajoutez ces méthodes dans votre composant
// Méthodes optimisées
private loadAcceptedReservations(): void {
  this.loading.approved = true;
  this.secretaryService.getAcceptedReservations().subscribe({
    next: (reservations) => {
    this.approvedReservations = reservations.map(res => ({
        ...res,
        heureDebut: new Date(res.heureDebut), // Conversion explicite
        heureFin: new Date(res.heureFin)
      }));
      this.stats.approved = reservations.length;
      this.updateFilteredRequests();
      this.loading.approved = false;
    },
    error: (err) => {
      console.error('Error loading accepted reservations:', err);
      this.loading.approved = false;
    }
  });
}

private loadRefusedReservations(): void {
  this.loading.rejected = true;
  this.secretaryService.getRefusedReservations().subscribe({
    next: (reservations) => {
      this.rejectedReservations = reservations;
      this.stats.rejected = reservations.length;
      this.updateFilteredRequests();
      this.loading.rejected = false;
    },
    error: (err) => {
      console.error('Error loading refused reservations:', err);
      this.loading.rejected = false;
    }
  });
}

canCancel(reservation: Reservation): boolean {
  const now = new Date();
  return reservation.statut === StatusReservation.ACCEPTEE && 
         new Date(reservation.heureDebut) > now;
}


// Add this to your component
cancelLoadingStates: { [id: string]: boolean } = {};

// Modified handleCancel
handleCancel(reservation: Reservation): void {
  const reason = prompt('Veuillez indiquer la raison de l\'annulation (optionnel)');
  
  if (reason === null) return;
  
  if (!confirm(`Êtes-vous sûr de vouloir annuler cette réservation?`)) return;

  this.cancelLoadingStates[reservation.id] = true;

  this.secretaryService.cancelReservation(reservation.id, reason || undefined)
    .pipe(finalize(() => delete this.cancelLoadingStates[reservation.id]))
    .subscribe({
      next: () => {
        forkJoin([
          this.loadApprovedReservations(),
          this.loadRejectedReservations(),
          this.loadViewedReservations()
        ]).subscribe(() => {
          // Refresh the calendar after lists are loaded
          this.calendarComponent?.loadSlots();
        });
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation:', err);
        alert('Échec de l\'annulation: ' + err.message);
      }
    });
}
isEquipmentApproved(reservationId: string, equip: string): boolean {
  return this.approvedEquipment[reservationId]?.includes(equip) || false;
}

toggleEquipmentApproval(reservationId: string, equip: string): void {
  if (!this.approvedEquipment[reservationId]) {
    this.approvedEquipment[reservationId] = [];
  }
  const index = this.approvedEquipment[reservationId].indexOf(equip);
  if (index === -1) {
    this.approvedEquipment[reservationId].push(equip);
  } else {
    this.approvedEquipment[reservationId].splice(index, 1);
  }
}



}      