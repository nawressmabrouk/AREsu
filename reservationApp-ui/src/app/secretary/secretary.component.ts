
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
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
  faSearch,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth/auth.service';

import { ProfileComponent } from '../shared/components/profile/profile.component';
interface Request {
  id: string;
  responsableAction: string;
  email: string;
  fonction: string;
  structure: string;
  type: 'interne' | 'externe';
  linkedin?: URL;
  approvedEquipments: string[];
  intituleAction: string;
  nbrParticipants: number;
  cible: string;
  description: string;
  nomSalle: string;
  respoSalle: string;
  date: string;
  duree: string;
  equipements: string[];
  status: 'pending' | 'approved' | 'rejected';
  decisionDate?: string;
  forwardDate?: string;
  statut?: string;
  seen: boolean;
}

@Component({
  selector: 'app-secretary',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    FontAwesomeModule,
    ProfileComponent
  ],
  templateUrl: './secretary.component.html',
  styleUrls: ['./secretary.component.scss']
})
export class SecretaryComponent {
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

  // UI states
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';
  searchTerm: string = '';
  currentPageTitle: string = 'Gestion des Réservations';
  currentPageSubtitle: string = 'Validation et contrôle des réservations des espaces';
  activeSection: 'access' | 'unseen' | 'seen' = 'access';
  isSidebarExpanded = false;

  // User data
  currentUser = {
    role: 'secretaire',
    nomPrenom: 'Secrétaire Générale',
    email: 'secretaire@universite.tn'
  };

  allRequests: Request[] = [
    {
      id: 'RES-2025-005',
      responsableAction: 'Nourhen Zroud',
      email: 'nourhen.zroud@univ.com',
      fonction: 'Enseignante',
      structure: 'Département Mathématiques',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/nourhen-zroud'),
      intituleAction: 'Séminaire de recherche',
      nbrParticipants: 20,
      cible: 'Enseignants et étudiants',
      description: 'Présentation des dernières recherches',
      nomSalle: 'Amphi A',
      respoSalle: 'Samir Toumi',
      date: '20/03/2025',
      duree: '14:00 - 17:00',
      equipements: [],
      approvedEquipments: [],
      status: 'pending',
      seen: false
    },
    {
      id: 'RES-2025-001',
      responsableAction: 'Ali Ben Salah',
      email: 'ali.bensalah@univ.com',
      fonction: 'Enseignant',
      structure: 'Département Informatique',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/ali-bensalah'),
      intituleAction: 'Réunion département informatique',
      nbrParticipants: 15,
      cible: 'Enseignants',
      description: 'Réunion mensuelle du département',
      nomSalle: 'Salle A1',
      respoSalle: 'Mohamed Khemiri',
      date: '15/03/2025',
      duree: '09:00 - 12:00',
      equipements: ['Projecteur', 'Ordinateur'],
      approvedEquipments: [],
      status: 'approved',
      decisionDate: '14/03/2025',
      statut: 'Acceptée',
      seen: false
    },
    {
      id: 'RES-2025-002',
      responsableAction: 'Sarra Jouini',
      email: 'sarra.jouini@entreprise.com',
      fonction: 'Responsable RH',
      structure: 'Entreprise XYZ',
      type: 'externe',
      linkedin: new URL('https://www.linkedin.com/in/sarra-jouini'),
      intituleAction: 'Soutenance de projet fin d\'études',
      nbrParticipants: 8,
      cible: 'Étudiants',
      description: 'Présentation des projets fin d\'études',
      nomSalle: 'Amphi B',
      respoSalle: 'Leila Ben Ammar',
      date: '16/03/2025',
      duree: '14:00 - 17:00',
      equipements: [],
      approvedEquipments: [],
      status: 'rejected',
      decisionDate: '14/03/2025',
      statut: 'Refusée',
      seen: false
    },
    {
      id: 'RES-2025-003',
      responsableAction: 'Mohamed Khemiri',
      email: 'mohamed.khemiri@univ.com',
      fonction: 'Responsable Labo',
      structure: 'Laboratoire Informatique',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/mohamed-khemiri'),
      intituleAction: 'Formation enseignants nouveaux logiciels',
      nbrParticipants: 25,
      cible: 'Enseignants',
      description: 'Formation sur les nouveaux outils pédagogiques',
      nomSalle: 'Lab Info 2',
      respoSalle: 'Ali Ben Salah',
      date: '17/03/2025',
      duree: '10:00 - 16:00',
      equipements: ['Projecteur', 'Ordinateurs', 'Système audio'],
      approvedEquipments: [],
      status: 'pending',
      seen: false
    },
    {
      id: 'RES-2025-004',
      responsableAction: 'Leila Ben Ammar',
      email: 'leila.benammar@univ.com',
      fonction: 'Directrice département',
      structure: 'Département Informatique',
      type: 'interne',
      linkedin: new URL('https://www.linkedin.com/in/leila-benammar'),
      intituleAction: 'Réunion conseil pédagogique',
      nbrParticipants: 12,
      cible: 'Enseignants',
      description: 'Réunion du conseil pédagogique',
      nomSalle: 'Salle de réunion B2',
      respoSalle: 'Mohamed Khemiri',
      date: '18/03/2025',
      duree: '08:30 - 11:30',
      equipements: ['Projecteur', 'Tableau blanc'],
      approvedEquipments: [],
      status: 'approved',
      forwardDate: '14/03/2025',
      statut: 'acceptée',
      seen: true
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.initializeRequests();
  }

  private initializeRequests(): void {
    this.allRequests = this.allRequests.map(request => ({
      ...request,
      approvedEquipments: request.approvedEquipments || []
    }));
  }

  markAsSeen(request: Request): void {
    request.seen = true;
  }

  getUnseenRequests(): Request[] {
    return this.allRequests.filter(request => !request.seen);
  }

  getSeenRequests(): Request[] {
    return this.allRequests.filter(request => request.seen);
  }

  getStatusCircleClass(status: string): string {
    const baseClass = 'status-circle';
    switch(status) {
      case 'approved': return `${baseClass} approved`;
      case 'rejected': return `${baseClass} rejected`;
      case 'pending': return `${baseClass} pending`;
      default: return baseClass;
    }
  }

  get stats() {
    return {
      pending: this.allRequests.filter(r => r.status === 'pending').length,
      approved: this.allRequests.filter(r => r.status === 'approved').length,
      rejected: this.allRequests.filter(r => r.status === 'rejected').length
    };
  }

  get filteredRequests(): Request[] {
    let requests = this.allRequests.filter(r => r.status === this.activeTab);
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      requests = requests.filter(r => 
        r.responsableAction.toLowerCase().includes(term) || 
        r.id.toLowerCase().includes(term) ||
        r.intituleAction.toLowerCase().includes(term)
      );
    }
    
    return requests;
  }

  setActiveTab(tab: 'pending' | 'approved' | 'rejected'): void {
    this.activeTab = tab;
    this.searchTerm = '';
  }

  approveRequest(request: Request): void {
    if (request.status === 'pending') {
      request.equipements = [...request.approvedEquipments];
      request.status = 'approved';
      request.decisionDate = new Date().toLocaleDateString();
      request.statut = 'Acceptée';
      request.seen = true;
  
      const year = new Date().getFullYear();
      const seq = this.allRequests.filter(r => r.status === 'approved').length + 1;
      request.id = `RES-${year}-${seq.toString().padStart(3, '0')}`;
    }
  }

  rejectRequest(request: Request): void {
    if (request.status === 'pending') {
      request.status = 'rejected';
      request.decisionDate = new Date().toLocaleDateString();
      request.statut = 'Refusée';
      request.seen = true;
    }
  }

  forwardRequest(request: Request): void {
    if (request.status === 'pending') {
      request.status = 'approved';
      request.forwardDate = new Date().toLocaleDateString();
      request.statut = 'En attente';
      request.seen = true;
    }
  }

  getStatusClass(status: string): { [key: string]: boolean } {
    return {
      'status-pending': status === 'pending' || status === 'En attente',
      'status-approved': status === 'approved' || status === 'Acceptée',
      'status-rejected': status === 'rejected' || status === 'Refusée',
    };
  }

  switchSection(section: 'access' | 'unseen' | 'seen'): void {
    this.activeSection = section;
    this.searchTerm = '';
    
    if (section === 'access') {
      this.activeTab = 'pending';
      this.currentPageTitle = 'Gestion des Réservations';
      this.currentPageSubtitle = 'Validation et contrôle des accès utilisateurs';
    } 
    else if (section === 'unseen') {
      this.currentPageTitle = 'Demandes non vues';
      this.currentPageSubtitle = 'Liste des demandes non encore consultées';
    }
    else {
      this.currentPageTitle = 'Demandes vues';
      this.currentPageSubtitle = 'Liste des demandes déjà consultées';
    }
  }

  toggleSidebar(): void {
    this.isSidebarExpanded = !this.isSidebarExpanded;
  }

  isEquipmentAvailable(equipment: string): boolean {
    return true;
  }

  toggleEquipment(request: Request, equipment: string): void {
    const index = request.approvedEquipments.indexOf(equipment);
    if (index === -1) {
      request.approvedEquipments.push(equipment);
    } else {
      request.approvedEquipments.splice(index, 1);
    }
  }

  onSearch() {
    console.log("Recherche lancée pour :", this.searchTerm);
  }
}         
