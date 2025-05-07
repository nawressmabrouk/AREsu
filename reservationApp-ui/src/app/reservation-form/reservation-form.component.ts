import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRight,
  faHome,
  faPlus,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../services/auth/auth.service';
import { ReservationsubmissionService } from '../services/reservationflow/reservationsubmission.service';
import { User } from '../shared/interfaces/user.interface';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [FontAwesomeModule, FormsModule, CommonModule, RouterModule],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss'],
  providers: [DatePipe]
})
export class ReservationFormComponent implements OnInit {
  // Font Awesome icons
  faPageIcon = faArrowRight;
  faHome = faHome;
  faPlus = faPlus;
  faTimes = faTimes;
  
  // Form state
  isTooltipVisible = false;
  formSubmitted = false;
  showEquipmentModal = false;
  isLoading = false;
  errorMessage: string | null = null;
  
  // Equipment management
  selectedEquipments: string[] = [];
  equipmentsList = ['Projecteur', 'Tableau blanc', 'Ordinateurs', 'Système audio', 'Wi-Fi'];
  customEquipment: string = '';

  // Add these methods to handle equipment selection
isEquipmentSelected(equipment: string): boolean {
  return this.selectedEquipments.includes(equipment);
}


toggleEquipmentSelection(equipment: string): void {
  const index = this.selectedEquipments.indexOf(equipment);
  if (index === -1) {
    this.selectedEquipments.push(equipment);
  } else {
    this.selectedEquipments.splice(index, 1);
  }
}

  // Reservation data
  reservation = {
    responsableAction: '',
    intituleAction: '',
    nbrParticipant: null as number | null,
    numTelR: '',
    cible: '',
    emailR: '',
    fonctionR: '',
    structure: '',
    lienLinkedInR: '',
    description: '',
    etablissementId: '',
    espaceId: '',
    heureDebut: '',
    heureFin: '',
    statut: 'EN_ATTENTE',
    vueParSecretaire: false,
 
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private datePipe: DatePipe,
    private authService: AuthService,
    private reservationService: ReservationsubmissionService
  ) {}
 
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const requiredParams = [
        'date', 
        'startTime', 
        'endTime',
        'etablissementId',
        'espaceId'
      ];
      
      const missingParams = requiredParams.filter(p => !params[p]);
      
      if (missingParams.length > 0) {
        console.error('Missing required parameters:', missingParams);
        this.router.navigate(['/calendar'], {
          queryParams: {
            etablissementId: params['etablissementId'],
            espaceId: params['espaceId']
          }
        });
        return;
      }
  
      // Set all parameters from URL
      this.reservation = {
        ...this.reservation,
        etablissementId: params['etablissementId'],
        espaceId: params['espaceId'],
        heureDebut: this.formatISODateTime(params['date'], params['startTime']),
        heureFin: this.formatISODateTime(params['date'], params['endTime'])
      };
    });
  }

  private formatISODateTime(dateStr: string, timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  }

  // Equipment methods
  showAddEquipmentModal(): void {
    this.showEquipmentModal = true;
    this.customEquipment = '';
  }

  cancelAddEquipment(): void {
    this.showEquipmentModal = false;
    this.customEquipment = '';
  }

  addCustomEquipment(): void {
    const newEq = this.customEquipment.trim();
    if (newEq) {
      if (!this.equipmentsList.some(e => e.toLowerCase() === newEq.toLowerCase())) {
        this.equipmentsList = [...this.equipmentsList, newEq];
      }
      this.customEquipment = '';
      this.showEquipmentModal = false;
    }
  }




  // Form validation methods
  emailIsValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.reservation.emailR);
  }

  linkedInIsValid(): boolean {
    if (!this.reservation.lienLinkedInR) return false;
    try {
      const url = new URL(this.reservation.lienLinkedInR);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  participantsIsValid(): boolean {
    return this.reservation.nbrParticipant !== null && 
           this.reservation.nbrParticipant > 0;
  }

  timeSlotIsValid(): boolean {
    if (!this.reservation.heureDebut || !this.reservation.heureFin) {
      return false;
    }
  
    try {
      const startDate = new Date(this.reservation.heureDebut);
      const endDate = new Date(this.reservation.heureFin);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }
  
      return endDate > startDate;
    } catch (e) {
      return false;
    }
  }
  
  
  
  
  isFormValid(form: NgForm): boolean {
    return !!(
      form.valid &&
      this.reservation.responsableAction.trim() !== '' &&
      this.reservation.intituleAction.trim() !== '' &&
      this.participantsIsValid() &&
      this.reservation.cible.trim() !== '' &&
      this.emailIsValid() &&
      this.reservation.fonctionR.trim() !== '' &&
      this.reservation.structure.trim() !== '' &&
      this.linkedInIsValid() &&
      this.reservation.description.trim() !== '' &&
      this.timeSlotIsValid()
    );
  }
  
  
  
  
  
  
  
  
  

  async onSubmit(form: NgForm): Promise<void> {
    this.formSubmitted = true;
    this.errorMessage = null;
    this.isLoading = true;

    try {
        // Validate form first
        if (!this.isFormValid(form)) {
            throw new Error('Veuillez remplir tous les champs obligatoires correctement');
        }

        // Get current user
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser?.userId) {
            throw new Error('Session expirée, veuillez vous reconnecter');
        }

        // Prepare payload
        const reservationPayload = {
            ...this.reservation,
            nbrParticipant: Number(this.reservation.nbrParticipant),
            equipements: this.selectedEquipments,
            demandeurId: currentUser.userId,
            heureDebut: this.reservation.heureDebut,
            heureFin: this.reservation.heureFin
        };

        console.log('Submission payload:', reservationPayload);

        // Step 1: Create reservation
        const createResponse: any = await this.reservationService.createReservation(reservationPayload)
            .toPromise()
            .catch(err => {
                console.error('Creation error:', err);
                throw new Error(`Échec de la création: ${err.message}`);
            });

        console.log('Creation response:', createResponse);

        if (!createResponse?.id) {
            throw new Error('Réponse invalide du serveur - ID manquant');
        }

        // Step 2: Send to responsible
        console.log('Sending reservation ID:', createResponse.id);
        await this.reservationService.sendReservation(createResponse.id)
            .toPromise()
            .catch(err => {
                console.error('Sending error:', err);
                throw new Error(`Échec de l'envoi au responsable: ${err.message}`);
            });

        // Success handling
        this.showAlert('success', 'Réservation créée et envoyée avec succès!');
        this.router.navigate(['/spaces'], {
            state: {
                reservationData: reservationPayload,
                reservationId: createResponse.id
            }
        });

    } catch (error: any) {
        console.error('Full error stack:', error);
        this.isLoading = false;
        
        let errorMsg = error.message;
        
        // Handle specific error cases
        if (error instanceof HttpErrorResponse) {
            console.error('HTTP Error Details:', error);
            
            // Try to extract backend message
            if (error.error && typeof error.error === 'object') {
                errorMsg = error.error.message || JSON.stringify(error.error);
            } else if (typeof error.error === 'string') {
                errorMsg = error.error;
            }
            
            // Special case for 200 errors
            if (error.status === 200) {
                errorMsg = 'Format de réponse inattendu du serveur';
            }
        }

        this.showAlert('error', errorMsg);
        this.errorMessage = errorMsg;
    } finally {
        this.isLoading = false;
    }
}
  testFormSubmit() {
    console.log('Test submit triggered');
    alert('Le bouton submit fonctionne!');
  }

showAlert(type: 'success'|'error', message: string): void {
  // Utilisation de alert() simple pour le débogage
  alert(`${type.toUpperCase()}: ${message}`);
  
  // Pour une meilleure expérience utilisateur, vous pourriez utiliser :
  // - Un service de notifications/toast
  // - Une div d'alerte dans votre template
  // - Un modal personnalisé
}


  goBack(): void {
    this.router.navigate(['/spaces']);
  }

  
  
 
 
  showError(field: string): boolean {
    const reservation = this.reservation as any;
    if (!this.formSubmitted) return false;
    
    return reservation[field] === '' || 
           (field === 'nbrParticipant' && !this.participantsIsValid()) ||
           (field === 'emailR' && !this.emailIsValid()) ||
           (field === 'lienLinkedInR' && !this.linkedInIsValid());
  }
 
  
}