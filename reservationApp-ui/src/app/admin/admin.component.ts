import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBriefcase,
  faBuilding,
  faEdit,
  faEnvelope,
  faHome,
  faLink, faLock,
  faPhone,
  faPlusCircle,
  faTasks,
  faTools,
  faTrash,
  faUniversity,
  faUser,
  faUsers,
  faUsersCog,
  faUserTag
} from '@fortawesome/free-solid-svg-icons';
import { NotificationComponent } from '../alert-notif/notification.component';
import { AdminRegistrationService, AdminUser } from '../services/admin/admin-registration.service';
import { NotificationService } from '../services/alert-notif/notification.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';


interface Espace {
  id: string;
  nom: string;
  capacite: number;
  disponibilite: boolean;
  equipement: string[];
  responsableId: string;
  responsableNom: string | null;
  etablissementId: string;
  etablissementNom: string;
  categorie: string;
  type: string;
}

export enum Role {
  ADMIN = 'ADMIN',
  SECRETAIRE_GENERALE = 'SECRETAIRE_GENERALE',
  RESPONSABLE_SALLE = 'RESPONSABLE_SALLE',
  DEMANDEUR = 'DEMANDEUR'
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule, FormsModule, ProfileComponent, NotificationComponent],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  faUser = faUser;
  faEnvelope = faEnvelope;
  faBriefcase = faBriefcase;
  faPhone = faPhone;
  faBuilding = faBuilding;
  faUniversity = faUniversity;
  faLink = faLink;
  faLock = faLock;
  faUsers = faUsers;
  faTools = faTools;
  faHome = faHome;
  faPageIcon = faArrowRight;
  faUsersCog = faUsersCog;
  faTasks = faTasks;
  faEdit = faEdit;
  faTrash = faTrash;
  faPlusCircle = faPlusCircle;
  faUserTag = faUserTag;


  showModal: string | null = null;
  currentEspaceView: string | null = null;
  showEspaceOptions: boolean = false;
  showSousAdminOptions: boolean = false;
  currentSousAdminView: 'ajouter' | 'gerer' = 'ajouter';
  isEditingSousAdmin: boolean = false;
  isEditingEspace: boolean = false;
  selectedCategory: string = '';

  espaces: Espace[] = [];
  sousAdmins: AdminUser[] = [];
  currentSousAdmin: AdminUser | null = null;
  currentEspace: Espace | null = null;
  searchSousAdmin: string = '';
  searchEspace: string = '';

  // Current user
  currentUser: any = {
    role: 'ADMIN',
    nomPrenom: 'Admin',
    email: 'admin@univ-sousse.tn'
  };

  // Form data
  sousAdminFormData: AdminUser = {
    nom: '',
    prenom: '',
    email: '',
    numTel: '',
    role: Role.RESPONSABLE_SALLE,
    fonction: '',
    nomEtablissement: '',
    structure: '',
    linkedInLink: '',
    espacesResponsables: []
  };

  espaceFormData: any = {
    nom: '',
    capacite: null,
    equipement: '',
    categorie: '',
    type: '',
    responsableId: ''
  };

  categories = [
    { 
      name: 'Espaces administratifs & académiques',
      types: ['Laboratoire_de_recherche', 'Salle_de_conference', 'Salle_de_marche/bourse']
    },
    { 
      name: "Espaces d'employabilité & d'innovation",
      types: ['Espace_4C', 'Incubateur', 'FabLab', 'Coworking_space', 'Pole_etudiant_entrepreneur']
    }
  ];

  constructor(
    private router: Router,
    private adminService: AdminRegistrationService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.loadEspaces();
    this.loadSousAdmins();
  }

   // Toggles visibility of space management options panel
  toggleEspaceOptions() {
    this.showEspaceOptions = !this.showEspaceOptions;
    if (!this.showEspaceOptions) {
      this.showModal = null;
    }
  }

  // Toggles visibility of sub-admin management options panel  
  toggleSousAdminOptions() {
    this.showSousAdminOptions = !this.showSousAdminOptions;
    if (!this.showSousAdminOptions) {
      this.showModal = null;
    }
  }

    // Closes all modals and resets forms
  closeModal() {
    this.showModal = null;
    this.currentEspaceView = null;
    this.resetForms();
  }
 
   // Fetches all spaces from the API
private loadEspaces() {
  this.adminService.getAllEspaces().subscribe({
    next: spaces => {
      this.espaces = spaces.map(s => ({
        ...s,
        responsableNom: s.responsableNom ?? ''  
      }));
    },
    error: err => {
      console.error('Error loading spaces:', err);
      this.notificationService.showError('Failed to load spaces');
    }
  });
}

// Fetches all sub-admins (responsables) from the API
  private loadSousAdmins() {
    this.adminService.getResponsables().subscribe({
      next: (responsables) => {
        this.sousAdmins = responsables;
      },
      error: (err) => {
        console.error('Error loading responsables:', err);
        this.notificationService.showError('Failed to load responsables');
      }
    });
  }

  // Handles sub-admin form submission
  onSubmitSousAdmin(event: Event) {
    event.preventDefault();

    if (!this.validateSousAdminForm()) return;

    if (this.isEditingSousAdmin) {
      this.updateSousAdmin();
    } else {
      this.createSousAdmin();
    }
  }

  // Validates sub-admin form fields
  private validateSousAdminForm(): boolean {
    const requiredFields = {
      'Nom': this.sousAdminFormData.nom,
      'Prénom': this.sousAdminFormData.prenom,
      'Email': this.sousAdminFormData.email,
      'Fonction': this.sousAdminFormData.fonction,
      'Téléphone': this.sousAdminFormData.numTel,
      'Structure': this.sousAdminFormData.structure
    };

    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value) {
        this.notificationService.showError(`Le champ ${fieldName} est obligatoire`);
        return false;
      }
    }

    if (!this.isValidEmail(this.sousAdminFormData.email)) {
      this.notificationService.showError('Veuillez entrer une adresse email valide');
      return false;
    }

    return true;
  }

  // Creates a new sub-admin via API
  private createSousAdmin() {
    const userData = {
      ...this.sousAdminFormData,
      espacesResponsables: this.parseEspacesResponsables()
    };

    this.adminService.registerAdmin(userData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Responsable créé avec succès !');
        this.loadSousAdmins();
        this.resetSousAdminForm();
      },
      error: (error) => {
        this.notificationService.showError(error.error?.message || 'Erreur lors de la création');
      }
    });
  }

  // Updates existing sub-admin via API
  private updateSousAdmin() {
    if (!this.currentSousAdmin?.id) return;

    const userData = {
      ...this.sousAdminFormData,
      espacesResponsables: this.parseEspacesResponsables()
    };

    this.adminService.updateAdmin(this.currentSousAdmin.id, userData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Modifications sauvegardées');
        this.loadSousAdmins();
        this.cancelEditSousAdmin();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

    // Parses responsible spaces string into array
private parseEspacesResponsables(): string[] {
  const espaces = this.sousAdminFormData.espacesResponsables;
  
  // Handle undefined/null case
  if (!espaces) {
    return [];
  }
  
  // Handle string case (comma-separated values)
  if (typeof espaces === 'string') {
    return espaces.split(',').map((item: string) => item.trim());
  }
  
  // Handle array case
  if (Array.isArray(espaces)) {
    return espaces;
  }
  
  // Fallback for any other type
  return [];
}

// Prepares form for editing existing sub-admin
  onEditSousAdmin(admin: AdminUser) {
    this.currentSousAdmin = { ...admin };
    this.isEditingSousAdmin = true;
    this.currentSousAdminView = 'ajouter'; // Ajoutez cette ligne
  this.showModal = 'sous-admin'; // Assurez-vous que le modal est ouvert
    this.sousAdminFormData = {
      nom: admin.nom,
      prenom: admin.prenom,
      email: admin.email,
      numTel: admin.numTel,
      role: admin.role,
      fonction: admin.fonction,
      nomEtablissement: admin.nomEtablissement,
      structure: admin.structure,
      linkedInLink: admin.linkedInLink,
      espacesResponsables: admin.espacesResponsables
    };
  }

  // Deletes a sub-admin after confirmation
  onSupprimerSousAdmin(adminId: string) {
    if (!adminId) {
      this.notificationService.showError('ID non valide');
      return;
    }

    if (confirm('Confirmez la suppression de ce responsable ?')) {
      this.adminService.deleteAdmin(adminId).subscribe({
        next: () => {
          this.loadSousAdmins();
          this.notificationService.showSuccess('Suppression réussie');
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Erreur de suppression');
        }
      });
    }
  }

  // Cancels sub-admin editing mode
  cancelEditSousAdmin() {
    this.isEditingSousAdmin = false;
    this.currentSousAdmin = null;
    this.resetSousAdminForm();
  }

  // Handles space form submission
  onSubmitEspace(event: Event) {
    event.preventDefault();

    if (!this.validateEspaceForm()) return;

    if (this.isEditingEspace) {
      this.updateEspace();
    } else {
      this.createEspace();
    }
  }

  // Validates space form fields
  private validateEspaceForm(): boolean {
    const requiredFields = {
      'Nom': this.espaceFormData.nom,
      'Capacité': this.espaceFormData.capacite,
      'Responsable': this.espaceFormData.responsableId,
      'Catégorie': this.espaceFormData.categorie,
      'Type': this.espaceFormData.type
    };

    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value || (fieldName === 'Capacité' && value <= 0)) {
        this.notificationService.showError(`${fieldName} est requis`);
        return false;
      }
    }

    return true;
  }

  // Creates new space via API
  private createEspace() {
    const espaceData = {
      ...this.espaceFormData,
      capacite: Number(this.espaceFormData.capacite),
      equipement: this.parseEquipements()
    };

    this.adminService.ajouterEspace(this.espaceFormData.responsableId, espaceData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Espace ajouté avec succès');
        this.loadEspaces();
        this.resetEspaceForm();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur lors de l\'ajout');
      }
    });
  }

  // Updates existing space via API
  private updateEspace() {
    if (!this.currentEspace?.id) return;

    const espaceData = {
      ...this.espaceFormData,
      capacite: Number(this.espaceFormData.capacite),
      equipement: this.parseEquipements()
    };

    this.adminService.modifierEspace(this.currentEspace.id, espaceData).subscribe({
      next: () => {
        this.notificationService.showSuccess('Espace modifié avec succès');
        this.loadEspaces();
        this.cancelEditEspace();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur lors de la modification');
      }
    });
  }

  // Parses equipment string into array
  private parseEquipements(): string[] {
    return this.espaceFormData.equipement 
      ? this.espaceFormData.equipement.split(',').map((e: string) => e.trim())
      : [];
  }

   // Prepares form for editing existing space
  onEditEspace(espace: Espace) {
    this.currentEspace = { ...espace };
    this.isEditingEspace = true;
    this.currentEspaceView = 'ajouter'; // Ajoutez cette ligne
    this.showModal = 'espaces'; // Assurez-vous que le modal est ouvert


    this.espaceFormData = {
      nom: espace.nom,
      capacite: espace.capacite,
      equipement: Array.isArray(espace.equipement) 
                 ? espace.equipement.join(', ') 
                 : espace.equipement,
      responsableId: espace.responsableId,
      categorie: espace.categorie,
      type: espace.type
    };
    this.selectedCategory = espace.categorie;
  }

  // Deletes space after confirmation
  onSupprimerEspace(espaceId: string) {
    if (!espaceId) return;

    if (confirm('Confirmez la suppression de cet espace ?')) {
      // Find the responsableId for this space
      const espace = this.espaces.find(e => e.id === espaceId);
      if (!espace) return;

      this.adminService.supprimerEspace(espaceId).subscribe({
        next: () => {
          this.notificationService.showSuccess('Suppression réussie');
          this.loadEspaces();
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Erreur lors de la suppression');
        }
      });
    }
  }

  // Cancels space editing mode
  cancelEditEspace() {
    this.isEditingEspace = false;
    this.currentEspace = null;
    this.resetEspaceForm();
  }

  // Filters sub-admins based on search input
  get filteredSousAdmins(): AdminUser[] {
    return this.sousAdmins.filter(admin => {
      const search = this.searchSousAdmin.toLowerCase();
      return (
        admin.nom.toLowerCase().includes(search) ||
        admin.prenom.toLowerCase().includes(search) ||
        admin.email.toLowerCase().includes(search) ||
        admin.nomEtablissement.toLowerCase().includes(search)
      );
    });
  }

  // Filters spaces based on search input
  get filteredEspaces(): Espace[] {
    return this.espaces.filter(e =>
      e.nom.toLowerCase().includes(this.searchEspace.toLowerCase()) ||
      e.responsableNom?.toLowerCase().includes(this.searchEspace.toLowerCase())
    );
  }

  // Gets types for selected category
  getTypesForCategory(categoryName: string): string[] {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.types : [];
  }

  // Formats type names for display (replaces underscores)
  formatTypeName(type: string): string {
    return type ? type.replace(/_/g, ' ') : '';
  }

  // Validates email format
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

 // Resets all forms
  private resetForms() {
    this.resetSousAdminForm();
    this.resetEspaceForm();
  }

  // Resets sub-admin form to default values
  private resetSousAdminForm() {
    this.sousAdminFormData = {
      nom: '',
      prenom: '',
      email: '',
      numTel: '',
      role: Role.RESPONSABLE_SALLE,
      fonction: '',
      nomEtablissement: '',
      structure: '',
      linkedInLink: '',
      espacesResponsables: []
    };
  }

   // Resets space form to default values
  private resetEspaceForm() {
    this.espaceFormData = {
      nom: '',
      capacite: null,
      equipement: '',
      responsableId: '',
      categorie: '',
      type: ''
    };
    this.selectedCategory = '';
  }
}