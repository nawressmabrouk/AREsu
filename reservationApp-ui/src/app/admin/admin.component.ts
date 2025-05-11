import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faBriefcase,
  faBuilding,
  faEnvelope,
  faHome,
  faLink, faLock,
  faPhone,
  faPlusCircle,
  faTasks,
  faTools,
  faUniversity,
  faUser,
  faUsers,
  faUsersCog,
  faTrash,
  faEdit,
  faUserTag
} from '@fortawesome/free-solid-svg-icons';
import { NotificationComponent } from '../alert-notif/notification.component';
import { AdminRegistrationService, AdminUser } from '../services/admin/admin-registration.service';
import { NotificationService } from '../services/alert-notif/notification.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';
interface Espace {
  id: string; // Optionnel car généré par MongoDB
  nom: string;
  capacite: number;
  equipement: string;
  responsableId: string;
  etablissementId: string;
  categorie: string;
  type: string;
}
export enum Role {
  ADMIN = 'ADMIN',
  SECRETAIRE_GENERALE = 'SECRETAIRE_GENERALE',
  RESPONSABLE_SALLE = 'RESPONSABLE_SALLE'
}
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule, FormsModule , ProfileComponent, NotificationComponent],
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
  faHome = faHome ;
  faPageIcon = faArrowRight ;
  faUsersCog = faUsersCog ;
  faTasks = faTasks ;
  faEdit = faEdit;
faTrash = faTrash;
  faPlusCircle = faPlusCircle ;
  showModal: string | null = null;
  currentEspaceView: string | null = null;
  showEspaceOptions: boolean = false;
faUserTag = faUserTag;
  
  espace: any = {};
  espaces: Espace[] = []; // Liste des espaces
currentEspace: Espace = {
  id: '', 
  nom: '',
  capacite: 0,
  equipement: '',
  responsableId: '',
  etablissementId: '', 
  categorie: '',
  type: ''
};

sousAdminFormData: AdminUser = {
  nom: '',
  prenom: '',
  email: '',
  numTel: '',
  role: Role.RESPONSABLE_SALLE,
  fonction: '',
  nomEtablissement: '',
  structure: '',
  espacesResponsables: []
};

roles = [
  { value: Role.SECRETAIRE_GENERALE, label: 'Secrétaire Générale' },
  { value: Role.RESPONSABLE_SALLE, label: 'Responsable Salle' }
];
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

showSousAdminOptions: boolean = false;
currentSousAdminView: 'ajouter' | 'gerer' = 'ajouter';
searchSousAdmin: string = '';
sousAdmins: AdminUser[] = [];
currentSousAdmin: AdminUser | null = null;
isEditingSousAdmin: boolean = false;

selectedCategory: string = '';
selectedType: string = '';

  // currentUser pour le profile
  currentUser: any = {
    role: 'ADMIN',
    nomPrenom: 'Admin',
    email: 'admin@univ-sousse.tn'
  };

// Méthodes pour gérer les modales
openModal(modalType: string): void {
  this.showModal = modalType;
  if (modalType === 'gestion-espaces') {
    this.currentEspaceView = 'ajouter-espace'; // Vue par défaut
  }
}
toggleEspaceOptions() {
  this.showEspaceOptions = !this.showEspaceOptions;
  // Si vous voulez fermer les options quand on clique ailleurs
  if (!this.showEspaceOptions) {
    this.showModal = null;
  }
}

closeModal(): void {
  this.showModal = null;
  this.currentEspaceView = null;
}
searchEspace: string = ''; // Pour la recherche
isEditingEspace: boolean = false; // Mode édition
  currentView: 'sous-admin' | 'ajouter-espace' | 'gerer-espaces' = 'sous-admin';
  selectedEspace: any = null;
  espaceFormData: any = {
    nom: '',
    capacite: null,
    equipement: '',
    etablissementId: '',
    categorie: '',
    type: '',
    responsableId: ''
  }; 

  constructor(
    private router: Router,
    private adminService: AdminRegistrationService ,
    private notificationService: NotificationService,

  ) {}

  ngOnInit() {
    this.loadEspacesFromDatabase();
     this.loadSousAdminsFromDatabase();
  }
 
 
 



private loadEspacesFromDatabase() {
  this.adminService.getAllEspaces().subscribe({
    next: (apiEspaces) => {
      this.espaces = apiEspaces.map(apiEspace => ({
        id: apiEspace.id,
        nom: apiEspace.nom,
        capacite: apiEspace.capacite,
        equipement: Array.isArray(apiEspace.equipement) 
                   ? apiEspace.equipement.join(', ') 
                   : apiEspace.equipement,
        responsableId: apiEspace.responsableId, // Utiliser directement le champ de l'API
        etablissementId: apiEspace.etablissementId, // Utiliser directement le champ de l'API
        categorie: apiEspace.categorie,
        type: apiEspace.type
      }));
    },
    error: (err) => {
      console.error('Erreur de chargement:', err);
      this.notificationService.showError('Échec du rafraîchissement des espaces');
    }
  });
}
  getTypesForCategory(categoryName: string): string[] {
    const category = this.categories.find(cat => cat.name === categoryName);
    return category ? category.types : [];
  }
 

/*
  onSubmitSousAdmin(
  
  
  lastName: string,
    firstName: string,
    email: string,
    fonction: string,
    numTel: string,
    nomEtablissement: string,
    linkedInLink: string,
    structure: string,
    isSecretaire: boolean,
    isResponsable: boolean,
    espacesResponsables: string,
    event: Event
  ) {
    event.preventDefault();
  

    // Liste des champs obligatoires (sans linkedInLink)
    const requiredFields = {
      'Nom': firstName,
      'Prénom': lastName,
      'Email': email,
      'Fonction': fonction,
      'Téléphone': numTel,
      'Établissement': nomEtablissement,
      'Structure': structure,
      'espaces responsables': espacesResponsables ,
      'Rôle': (isSecretaire || isResponsable),
   
    };
  
    // Vérification des champs obligatoires
    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value) {
        this.notificationService.showError(`Le champ ${fieldName} est obligatoire`);
        return;
      }
    }
  
      // Validation du format de l'email
  if (!this.isValidEmail(email)) {
    this.notificationService.showError('Veuillez entrer une adresse email valide (ex: exemple@domain.com)');
    return;
  }

 
  
  
    // Préparation des données (linkedInLink reste optionnel)
    const userData = {
      nom: firstName,
      prenom: lastName,
      email: email,
      numTel: numTel,
      role: isSecretaire ? 'SECRETAIRE_GENERALE' : 'RESPONSABLE_SALLE',
      fonction: fonction,
      nomEtablissement: nomEtablissement,
      structure: structure,
      linkedin: linkedInLink, // Ce champ reste optionnel
      espacesResponsables: espacesResponsables 
        ? espacesResponsables.split(',').map(item => item.trim())
        : []
    };
  
    this.adminService.registerAdmin(userData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Sous-admin créé avec succès !');
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError('Erreur lors de la création du compte.');
      }
    });
  
  }*/

// Méthodes pour Sous-admins
toggleSousAdminOptions() {
  this.showSousAdminOptions = !this.showSousAdminOptions;
  if (!this.showSousAdminOptions) {
    this.showModal = null;
  }
}

loadSousAdminsFromDatabase() {
  this.adminService.getResponsables().subscribe({
    next: (admins) => {
      this.sousAdmins = admins;
    },
    error: (err) => {
      console.error('Erreur de chargement:', err);
      this.notificationService.showError('Échec du chargement des sous-admins');
    }
  });
}
onEditSousAdmin(admin: AdminUser) {
    this.resetSousAdminForm(); // Réinitialise avant de peupler
  this.currentSousAdmin = { ...admin };
  this.isEditingSousAdmin = true;
  
  // Pré-remplir le formulaire avec la bonne propriété
  this.sousAdminFormData = {
    nom: admin.nom,
    prenom: admin.prenom,
    email: admin.email,
    numTel: admin.numTel,
    role: admin.role,
    fonction: admin.fonction,
    nomEtablissement: admin.nomEtablissement,
    structure: admin.structure,
    linkedInLink: admin.linkedInLink, // Corriger le nom de propriété (linkedInLink → linkedin)
    espacesResponsables: admin.espacesResponsables
  };
}



onSupprimerSousAdmin(adminId: string) {

  if (!adminId) {
    this.notificationService.showError('ID non valide');
    return;
  }
  if (confirm('Confirmez la suppression de ce sous-admin ?')) {
    this.adminService.deleteAdmin(adminId).subscribe({
      next: () => {
        this.loadSousAdminsFromDatabase();
        this.notificationService.showSuccess('Suppression réussie');
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur de suppression');
      }
    });
  }
}
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

 //  méthodes pour ajouter  les espaces
 onSubmitEspace() {
  // Liste des champs obligatoires
  const requiredFields = {
    'ID du responsable': this.espaceFormData.responsableId,
    'Nom de l\'espace': this.espaceFormData.nom,
    'Capacité': this.espaceFormData.capacite,
    'ID de l\'établissement': this.espaceFormData.etablissementId, 
    'Catégorie': this.espaceFormData.categorie,
    'Type': this.espaceFormData.type
  };


  // Vérification des champs
  for (const [fieldName, value] of Object.entries(requiredFields)) {
    if (!value || (fieldName === 'Capacité' && value <= 0)) {
      this.notificationService.showError(`${fieldName} est requis`);
      return;
    }
  }
  
  const espaceData = {
    ...this.espaceFormData,
    capacite: Number(this.espaceFormData.capacite),
    equipement: this.espaceFormData.equipement.split(',').map((e: string) => e.trim()),
    responsableId: this.espaceFormData.responsableId
  };


  this.adminService.ajouterEspace(this.espaceFormData.responsableId, espaceData).subscribe({
    next: (response) => {
      // Ajout direct depuis la réponse de l'API
      const newEspace = {
        ...response,
        equipement: Array.isArray(response.equipement) ? 
                   response.equipement.join(', ') : 
                   response.equipement
      };
      
      // Mise à jour de la liste locale
      this.espaces.push(newEspace);
      
      this.notificationService.showSuccess('Espace ajouté avec succès');
      this.currentView = 'gerer-espaces';
      this.resetEspaceForm();

      // Rafraîchissement optionnel depuis le serveur
      this.loadEspacesFromDatabase();
    },
    error: (err) => {
      console.error(err);
      this.notificationService.showError(`Erreur: ${err.error?.message || 'Échec de l\'ajout'}`);
    }
  });
}



//  méthode pour valider le format d'email
isValidEmail(email: string): boolean {
  // Expression régulière simple pour validation d'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

//  méthodes pour modifier  les espaces
onModifierEspace() {
  if (!this.currentEspace.id) return;

  // Formatage des données pour le backend
  const espaceData = {
    nom: this.espaceFormData.nom,
    capacite: this.espaceFormData.capacite,
    equipement: this.espaceFormData.equipement.split(',').map((e: string) => e.trim()),
    etablissementId: this.espaceFormData.etablissementId,
    responsableId: this.espaceFormData.responsableId,
    categorie: this.espaceFormData.categorie,
    type: this.espaceFormData.type
  };


  this.adminService.modifierEspace(this.currentEspace.id, espaceData).subscribe({
    next: (updatedEspace) => {
      const index = this.espaces.findIndex(e => e.id === this.currentEspace.id);
      
      if (index !== -1) {
        // Mise à jour directe avec les données de l'API
        this.espaces[index] = { 
          ...updatedEspace,
          equipement: Array.isArray(updatedEspace.equipement) 
                     ? updatedEspace.equipement.join(', ') 
                     : updatedEspace.equipement
        };
        
        this.notificationService.showSuccess('Modification réussie !');
        this.currentView = 'gerer-espaces';
        this.resetEspaceForm();
        this.isEditingEspace = false;

        // Optionnel : Rafraîchir depuis le serveur pour synchronisation
        this.loadEspacesFromDatabase();
      }
    },
    error: (err) => {
      console.error('Échec de la modification', err);
      this.notificationService.showError(
        `Erreur: ${err.error?.message || 'Modification échouée'}`
      );
    }
  });
}


onSupprimerEspace(responsableId: string, espaceId: string) {
  if (confirm('Confirmez la suppression de cet espace ?')) {
    this.adminService.supprimerEspace(responsableId, espaceId).subscribe({
      next: () => {
        // Rafraîchissement forcé
        this.loadEspacesFromDatabase();
        this.notificationService.showSuccess('Suppression réussie');
      },
      error: (err) => {
        console.error('Détails erreur:', err);
        this.notificationService.showError(
          err.error?.message || 'Erreur lors de la suppression'
        );
      }
    });
  }
}

// Pour filtrer les espaces
get filteredEspaces(): Espace[] {
  return this.espaces.filter(e =>
    e.nom.toLowerCase().includes(this.searchEspace.toLowerCase()) ||
    e.responsableId.toLowerCase().includes(this.searchEspace.toLowerCase())
  );
} 
// Pour éditer un espace
onEditEspace(espace: Espace): void {
  this.currentEspace = {...espace};
  this.espaceFormData = {
    responsableId: espace.responsableId,
    nom: espace.nom,
    capacite: espace.capacite,
    equipement: espace.equipement,
    etablissementId: espace.etablissementId,
    categorie: espace.categorie,
    type: espace.type
  };
  this.selectedCategory = espace.categorie; // Ajout crucial
  this.currentView = 'ajouter-espace';
  this.isEditingEspace = true;
}

private resetEspaceForm() {
  this.espaceFormData = {
    responsableId: '',
    nom: '',
    capacite: null,
    equipement: '',
    etablissementId: '', 
     categorie: '',
    type: ''
  };
  this.selectedCategory = '';
} 

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
    espacesResponsables: []
  };
}

cancelEditSousAdmin() {
  this.isEditingSousAdmin = false;
  this.resetSousAdminForm();
  this.showModal = null; // Ferme le modal si nécessaire
}

cancelEditEspace() {
  this.isEditingEspace = false;
  this.resetEspaceForm();
  this.currentView = 'gerer-espaces';
}

formatTypeName(type: string): string {
  return type ? type.replace(/_/g, ' ') : '';
}

//Modification des méthodes dans le TypeScript
onSubmitSousAdmin() {
  // Utilisation directe de sousAdminFormData
  const requiredFields = {
    'Prénom': this.sousAdminFormData.prenom,
    'Nom': this.sousAdminFormData.nom,
    'Email': this.sousAdminFormData.email,
    'Rôle': this.sousAdminFormData.role,
    'Établissement': this.sousAdminFormData.nomEtablissement
  };

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      this.notificationService.showError(`${field} est requis`);
      return;
    }
  }

  this.adminService.registerAdmin(this.sousAdminFormData).subscribe({
    next: (res) => {
      this.notificationService.showSuccess('Sous-admin créé !');
      this.loadSousAdminsFromDatabase();
      this.resetSousAdminForm();
    },
    error: (err) => {
      this.notificationService.showError(err.error?.message || 'Erreur');
    }
  });
}

onModifierSousAdmin() {
  if (!this.currentSousAdmin?.id) return;

  this.adminService.updateAdmin(this.currentSousAdmin.id, this.sousAdminFormData)
    .subscribe({
      next: () => {
        this.notificationService.showSuccess('Modifications sauvegardées');
        this.loadSousAdminsFromDatabase();
        this.cancelEditSousAdmin();
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Erreur');
      }
    });
}

}    