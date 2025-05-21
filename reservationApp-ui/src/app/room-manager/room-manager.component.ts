
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild ,OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import {
  faArrowRight,
  faBars,
  faBriefcase,
  faBuilding,
  faCalendarAlt,
  faChalkboard,
  faChalkboardTeacher,
  faCheckCircle,
  faClock,
  faDesktop,
  faDiagramProject,
  faDoorOpen,
  faEdit,
  faEnvelope,
  faEye,
  faEyeSlash,
  faHome,
  faKey,
  faLock,
  faPhone,
  faPlusCircle,
  faPlusSquare,
  faSave,
  faSearch,
  faSignOutAlt,
  faTimesCircle,
  faTools,
  faTrash,
  faUniversity,
  faUser,
  faUserGraduate,
  faUsers,
  faUserTag,
  faUserTie,
  faVolumeUp,
  faWifi , faTimes
} from '@fortawesome/free-solid-svg-icons';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { finalize } from 'rxjs/operators';
import { Reservation, StatusReservation } from '../models/reservation.model';
import { ReservationsCalendarComponent } from '../reservations-calendar/reservations-calendar.component';
import { AuthService } from '../services/auth/auth.service';
import { RoomManagerService } from '../services/room-manager/room-manager.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';
import { Espace } from '../models/espace.model';
import { UserService } from '../services/user/user.service';

@Component({
  selector: 'app-room-manager',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FontAwesomeModule,
    ProfileComponent,
    ReservationsCalendarComponent
  ],
  templateUrl: './room-manager.component.html',
  styleUrls: ['./room-manager.component.scss']
})
export class RoomManagerComponent implements OnInit {
  @ViewChild('profileContainer', { static: true }) profileContainer!: ElementRef;
   @ViewChild(ReservationsCalendarComponent) calendarComponent!: ReservationsCalendarComponent;
  etablissementId: string = '';
  // Font Awesome icons
  faHome = faHome; 
  faSearch = faSearch;
  faPageIcon = faArrowRight;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faAccessIcon = faKey;
  faAddSpaceIcon = faPlusSquare;
  faBars = faBars;
  faSave = faSave;
  faEdit = faEdit;
  faTrash = faTrash;
  faDoorOpen = faDoorOpen;
  faBuilding = faBuilding;
  faChalkboard = faChalkboard;
  faUsers = faUsers;
  faTools = faTools;
  faPlusCircle = faPlusCircle;
  faChalkboardTeacher = faChalkboardTeacher;
  faDesktop = faDesktop;
  faVolumeUp = faVolumeUp;
  faWifi = faWifi;
  faSignOutAlt = faSignOutAlt;
  faCalendarAlt = faCalendarAlt;
  faUserTie = faUserTie;
  faDiagramProject = faDiagramProject;
  faUser = faUser;
  faUserGraduate = faUserGraduate; 
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faUserTag = faUserTag;
  faLinkedin = faLinkedin;
  faUniversity = faUniversity;
  faBriefcase = faBriefcase;
  faLock = faLock;
  faEye = faEye;
  faEyeSlash = faEyeSlash; 
  faTimes= faTimes ;
  // UI State
  isTooltipVisible = false;
  isSidebarExpanded = false;
  showDropdown = false;
  showProfileDropdown = false;
  showProfileModal = false;
  showEditModal = false;
  showReservationsModal = false;
  showPasswordModal = false;
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showEquipmentModal = false;

  // Data
  institutions = ['ESSTHS', 'IZET', 'ISSAT', 'ISITCOM'];
  spaceTypes = ['Amphithéâtre', 'Salle de conférence', 'Laboratoire', 'Salle de réunion', 'Salle de cours'];
  equipmentsList = ['Projecteur', 'Tableau blanc', 'Ordinateurs', 'Système audio', 'Wi-Fi'];
  customEquipment: string = '';
  
  currentPageTitle: string = 'Gestion des Réservations';
  currentPageSubtitle: string = 'Validation et contrôle des réservations des espaces';

  searchTerm: string = '';
 activeSection: 'access' | 'space' | 'calendar' = 'access'; // Ajout de 'calendar'
approvedEquipment: { [reservationId: string]: string[] } = {};
  managedSpaces: Espace[] = [];
currentSpace: Espace = {
  id: '',
  nom: '',
  disponibilite: true,
  capacite: 0,
  equipement: [],
  type: '',
  categorie: '',
  responsableId: '',
  equipementsDisponibles: {}
};
selectedEquipments: string[] = [];

spaceCategories = [
  {
    name: 'Espaces administratifs & académiques',
    types: ['Laboratoire_de_recherche', 'Salle_de_conference', 'Salle_de_marche/bourse']
  },
  {
    name: 'Espaces d\'employabilité & d\'innovation', 
    types: ['Espace_4C', 'Incubateur', 'FabLab', 'Coworking_space', 'Pole_etudiant_entrepreneur']
  }
];
customEquipmentInput = '';

editingSpace: Espace | null = null;
showAddSpaceModal = false;
isLoadingSpaces = false;

  spaces: any[] = []; // Créer une interface Space appropriée
 
   // Nouveaux états
   reservations: Reservation[] = [];
   currentStatus: StatusReservation = StatusReservation.EN_ATTENTE;
   isLoading = false;
   errorMessage?: string;
 
   // Nouveau mapping des statuts
   statusTabs = [
     { key: StatusReservation.EN_ATTENTE, label: 'En attente' },
     { key: StatusReservation.ACCEPTEE, label: 'Acceptées' },
     { key: StatusReservation.REFUSEE, label: 'Refusées' }
   ];
   
 pendingCount: number = 0;
approvedCount: number = 0;
rejectedCount: number = 0;

  editingIndex: number | null = null;

  constructor(private router: Router, private authService: AuthService ,  private roomManagerService: RoomManagerService , private userService: UserService) {}

  // User data
  currentUser = {
    role: 'roomManager',
    nomPrenom: 'Responsable Salle',
    email: 'salle@universite.tn'
  };

  ngOnInit() {
    this.loadUserProfile();
  }

    private loadUserProfile(): void {
    this.userService.getProfile().subscribe({
      next: (profile: any) => {
        console.log('Room Manager Profile:', profile);
        
        if (!profile.etablissementId) {
          console.error('No etablissementId in profile!');
          return;
        }
        
        this.etablissementId = profile.etablissementId;
        console.log('Using establishment ID:', this.etablissementId);
        
        // Load reservations after profile is loaded
        this.loadAllReservations();
      },
      error: (err) => {
        console.error('Error loading profile:', err);
      }
    });
  }


    private loadAllReservations(): void {
    this.statusTabs.forEach(tab => {
      this.loadReservations(tab.key);
    });
  }


  

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.profileContainer?.nativeElement && !this.profileContainer.nativeElement.contains(event.target)) {
      this.showProfileDropdown = false;
    }
  }
  private loadSpaces(): void {
    this.isLoadingSpaces = true;
    // Implémenter l'appel API via un service
    // this.roomManagerService.getSpaces().subscribe(...)
    setTimeout(() => {
      this.isLoadingSpaces = false;
    }, 1000); // Simulation de chargement
  }

// Add these methods to the existing component (code 1)
private loadManagedSpaces(): void {
  this.isLoadingSpaces = true;
  this.roomManagerService.getManagedSpaces()
    .pipe(finalize(() => this.isLoadingSpaces = false))
    .subscribe({
      next: (spaces) => this.managedSpaces = spaces,
      error: (err) => {
        console.error('Erreur chargement espaces:', err);
        this.errorMessage = "Échec du chargement des espaces";
      }
    });
}

openEditSpaceModal(espace: Espace): void {
  this.editingSpace = espace;
  this.currentSpace = { ...espace };
  this.showAddSpaceModal = true;
}

getTypesForCategory(category: string): string[] {
  const found = this.spaceCategories.find(cat => cat.name === category);
  return found ? found.types : [];
}

addCustomEquipment(): void {
  if (this.customEquipmentInput && this.customEquipmentInput.trim() !== '') {
    const newEquipment = this.customEquipmentInput.trim();
    
    if (!this.currentSpace.equipement.includes(newEquipment)) {
      this.currentSpace.equipement.push(newEquipment);
      this.customEquipmentInput = '';
      
      if (!this.equipmentsList.includes(newEquipment)) {
        this.equipmentsList.push(newEquipment);
      }
    } else {
      alert('Cet équipement existe déjà !');
    }
  }
}
removeEquipment(equip: string): void {
  const index = this.currentSpace.equipement.indexOf(equip);
  if (index !== -1) {
    this.currentSpace.equipement.splice(index, 1);
  }
}

closeSpaceModal(): void {
  this.showAddSpaceModal = false;
  this.editingSpace = null;
  this.currentSpace = {
    id: '',
    nom: '',
    disponibilite: true,
    capacite: 0,
    equipement: [],
    type: '',
    categorie: '',
    responsableId: '',
    equipementsDisponibles: {}
  };
}
toggleEquipment(equip: string): void {
  const index = this.currentSpace.equipement.indexOf(equip);
  if (index === -1) {
    this.currentSpace.equipement.push(equip);
  } else {
    this.currentSpace.equipement.splice(index, 1);
  }
}

addSpace(): void {
  this.isLoadingSpaces = true;
  // Implémentez l'ajout via votre service
  // this.roomManagerService.addSpace(this.currentSpace).subscribe(...)
  this.closeSpaceModal();
  this.loadManagedSpaces();
}
updateSpace(): void {
  if (!this.editingSpace) return;
  
  this.isLoadingSpaces = true;
  this.roomManagerService.updateSpace(this.editingSpace.id, this.currentSpace)
    .pipe(finalize(() => this.isLoadingSpaces = false))
    .subscribe({
      next: () => {
        this.closeSpaceModal();
        this.loadManagedSpaces();
      },
      error: (err) => console.error('Erreur modification:', err)
    });
}

confirmDeleteSpace(spaceId: string): void {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet espace?')) return;
  
  this.isLoadingSpaces = true;
  this.roomManagerService.deleteSpace(spaceId)
    .pipe(finalize(() => this.isLoadingSpaces = false))
    .subscribe({
      next: () => this.loadManagedSpaces(),
      error: (err) => console.error('Erreur suppression:', err)
    });
}



    // Nouvelle méthode de chargement
loadReservations(status: StatusReservation): void {
    this.isLoading = true;
    this.errorMessage = undefined;
    
    // Charge les réservations pour le statut demandé
    this.roomManagerService.getReservationsByStatus(status)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
            next: (reservations) => {
                this.reservations = reservations;
                
                // En parallèle, charge les comptes pour tous les statuts
                this.loadAllCounts();
            },
            error: (err) => this.errorMessage = err.message
        });
}

private loadAllCounts(): void {
    forkJoin([
        this.roomManagerService.getReservationsByStatus(StatusReservation.EN_ATTENTE),
        this.roomManagerService.getReservationsByStatus(StatusReservation.ACCEPTEE),
        this.roomManagerService.getReservationsByStatus(StatusReservation.REFUSEE)
    ]).subscribe({
        next: ([pending, approved, rejected]) => {
            this.pendingCount = pending.length;
            this.approvedCount = approved.length;
            this.rejectedCount = rejected.length;
        },
        error: (err: any) => console.error("Erreur lors du chargement des comptes", err)
    });
}


handleDecision(reservationId: string, accept: boolean): void {
  // Récupérer les équipements approuvés pour cette réservation
  const approvedEquipments = this.approvedEquipment[reservationId] || [];
  
  // Ajouter une confirmation si acceptation sans équipement
  if (accept && approvedEquipments.length === 0) {
    if (!confirm('Aucun équipement sélectionné. Voulez-vous accepter sans équipement ?')) return;
  }
  
  if (!confirm(`Êtes-vous sûr de vouloir ${accept ? 'accepter' : 'refuser'} cette réservation ?`)) return;

  this.isLoading = true;
  this.errorMessage = undefined;

  this.roomManagerService.makeDecision(reservationId, accept, approvedEquipments).pipe(
    finalize(() => this.isLoading = false)
  ).subscribe({
    next: () => {
      // Supprimer le cache des équipements approuvés après décision
      delete this.approvedEquipment[reservationId];
      this.loadReservations(this.currentStatus);
    },
    error: (err) => {
      this.errorMessage = err.message || 'Erreur lors de la décision';
      this.loadReservations(this.currentStatus);
    }
  });
}
  setActiveTab(status: StatusReservation): void {
    this.currentStatus = status;
    this.loadReservations(status);
  }

  
  toggleProfileDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  // Navigation methods
switchSection(section: 'access' | 'space' | 'calendar'): void {
  this.activeSection = section;
  this.searchTerm = '';

  switch(section) {
    case 'access':
      this.currentPageTitle = 'Gestion des Réservations';
      this.currentPageSubtitle = 'Validation et contrôle des accès utilisateurs';
      this.currentStatus = StatusReservation.EN_ATTENTE;
      this.loadReservations(this.currentStatus);
      break;
    case 'space':
      this.currentPageTitle = 'Gestion des Espaces';
      this.currentPageSubtitle = 'Création et configuration des espaces';
      this.loadManagedSpaces();
      break;
    case 'calendar':
      this.currentPageTitle = 'Calendrier des Réservations';
      this.currentPageSubtitle = 'Visualisation des réservations par calendrier';
      break;
  }
}

  toggleSidebar() {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }



readonly StatusReservation = StatusReservation; // Pour l'utiliser dans le template

// Remplacer par
getStatusClass(status: StatusReservation) {
  return {
    'status-en_attente': status === StatusReservation.EN_ATTENTE,
    'status-acceptee': status === StatusReservation.ACCEPTEE,
    'status-refusee': status === StatusReservation.REFUSEE
  };
}

// Implémenter la recherche
onSearch() {
  if (this.searchTerm) {
    // Filtrer les réservations existantes ou faire une nouvelle requête API
    this.reservations = this.reservations.filter(r =>
      r.intituleAction.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      r.responsableAction.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  } else {
    this.loadReservations(this.currentStatus);
  }
}

  openProfile() {
    this.showProfileModal = true;
    this.showProfileDropdown = false;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        // Optional: Show success message
      },
      error: (err) => {
        console.error('Logout error:', err);
        // Optional: Show error message
      }
    });
  }

 

  onPasswordInput(field: string) {
    // Gestion supplémentaire si nécessaire
  }

  getStatusIcon(status: StatusReservation) {
    const icons = {
      [StatusReservation.EN_ATTENTE]: faClock,
      [StatusReservation.ACCEPTEE]: faCheckCircle,
      [StatusReservation.REFUSEE]: faTimesCircle,
      [StatusReservation.ANNULEE]: faTimesCircle,
      [StatusReservation.ATTRIBUEE]: faCheckCircle,
      [StatusReservation.TERMINEE]: faClock
    };
    return icons[status] || faClock; // Fallback pour les cas non gérés
  }
  
getReservationCount(status: StatusReservation): number {
    switch(status) {
        case StatusReservation.EN_ATTENTE: return this.pendingCount;
        case StatusReservation.ACCEPTEE: return this.approvedCount;
        case StatusReservation.REFUSEE: return this.rejectedCount;
        default: return 0;
    }
}
  getStatusLabel(status: StatusReservation): string {
    const labels = {
      [StatusReservation.EN_ATTENTE]: 'À traiter',
      [StatusReservation.ACCEPTEE]: 'Acceptées',
      [StatusReservation.REFUSEE]: 'Refusées',
      [StatusReservation.ANNULEE]: 'Annulées',
      [StatusReservation.ATTRIBUEE]: 'Attribuées',
      [StatusReservation.TERMINEE]: 'Terminées'
    };
    return labels[status] || 'Inconnu';
  }

  // Vérifie si une réservation peut être annulée
canCancel(reservation: Reservation): boolean {
  const now = new Date();
  return reservation.statut === StatusReservation.ACCEPTEE && 
         new Date(reservation.heureDebut) > now;
}

handleCancel(reservation: Reservation): void {
  const reason = prompt('Veuillez indiquer la raison de l\'annulation (optionnel)');
  
  if (reason === null) return; // L'utilisateur a annulé
  
  if (!confirm(`Êtes-vous sûr de vouloir annuler cette réservation?`)) return;

  this.isLoading = true;
  this.roomManagerService.cancelReservation(reservation.id, reason || undefined)
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: () => {
        // Recharger les données
        this.loadReservations(this.currentStatus);
        this.loadAllCounts();
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


