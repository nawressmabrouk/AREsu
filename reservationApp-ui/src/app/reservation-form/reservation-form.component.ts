import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificationService } from '../services/alert-notif/notification.service';
import { AuthService } from '../services/auth/auth.service';
import { ReservationsubmissionService } from '../services/reservationflow/reservationsubmission.service';

import { lastValueFrom } from 'rxjs/internal/lastValueFrom';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PageHeaderComponent } from '../shared/ui/page-header.component';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, MatIcon, MatProgressSpinner, PageHeaderComponent],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.scss'],
  providers: [DatePipe]
})
export class ReservationFormComponent implements OnInit {
  // Font Awesome icons

  // Form state
  isTooltipVisible = false;
  formSubmitted = false;
  showEquipmentModal = false;
  isLoading = false;
  errorMessage: string | null = null;
  loadingSpaceDetails = false;
  
  // Equipment management
  selectedEquipments: string[] = [];
  equipmentsList = ['Projecteur', 'Tableau blanc', 'Ordinateurs', 'Système audio', 'Wi-Fi'];
  customEquipment: string = '';
  canAddEquipment = false;
  currentUser: any;
  selectedSpaceCapacity: number | null = null;
  selectedSpaceName: string = '';

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
    private reservationService: ReservationsubmissionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const userRole = this.currentUser?.role?.toUpperCase();
    
    this.canAddEquipment = userRole === 'DEMANDEUR_INTERNE' || 
                         userRole === 'ROLE_DEMANDEUR_INTERNE';

    this.route.queryParams.subscribe(params => {
      try {
        const requiredParams = [
          'date', 
          'startTime', 
          'endTime',
          'etablissementId',
          'espaceId'
        ];
        
        const missingParams = requiredParams.filter(p => !params[p]);
        
        if (missingParams.length > 0) {
          throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
        }

        // Validate and format times
        const startTime24h = this.convertTo24HourFormat(params['startTime']);
        const endTime24h = this.convertTo24HourFormat(params['endTime']);

        // Set reservation data with properly formatted times
        this.reservation = {
          ...this.reservation,
          etablissementId: params['etablissementId'],
          espaceId: params['espaceId'],
          heureDebut: this.formatISODateTime(params['date'], startTime24h),
          heureFin: this.formatISODateTime(params['date'], endTime24h)
        };

        // Load space details including capacity
        this.loadEspaceDetails(params['espaceId']);

        console.log('Reservation data initialized:', this.reservation);
      } catch (error) {
        console.error('Error initializing reservation:', error);
        this.errorMessage = 'Créneau invalide. Veuillez choisir un nouveau créneau.';
        this.router.navigate(['/selection-calendar'], {
          queryParams: {
            etablissementId: params['etablissementId'],
            espaceId: params['espaceId']
          }
        });
      }
    });
  }
 
private loadEspaceDetails(espaceId: string): void {
  this.loadingSpaceDetails = true;
  this.reservationService.getEspaceDetails(espaceId).subscribe({
    next: (espace) => {
      this.selectedSpaceCapacity = espace.capacite;  // Use the French field name
      this.selectedSpaceName = espace.nom;
      this.loadingSpaceDetails = false;
    },
    error: (err) => {
      console.error('Failed to load space details:', err);
      this.loadingSpaceDetails = false;
    }
  });
}
  private convertTo24HourFormat(timeStr: string): string {
    if (!timeStr) throw new Error('Time string is empty');
    
    // If already in 24-hour format (HH:mm)
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }
    
    // Handle AM/PM format
    const [timePart, period] = timeStr.split(' ');
    const [hoursStr, minutesStr] = timePart.split(':');
    
    let hours = parseInt(hoursStr, 10);
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  formatISODateTime(dateStr: string, timeStr: string): string {
    if (!dateStr || !timeStr) {
      throw new Error('Both date and time are required');
    }

    // Parse date (yyyy-MM-dd) and time (HH:mm)
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Create date in local timezone (Tunis)
    const date = new Date(year, month - 1, day, hours, minutes);
    
    // Validate the date
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date/time combination: ${dateStr} ${timeStr}`);
    }

    // Convert to ISO string (UTC)
    return date.toISOString();
  }

  // Equipment methods
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
    if (!this.reservation.lienLinkedInR) return true; 
    
    try {
      new URL(this.reservation.lienLinkedInR);
      return true;
    } catch {
      return false;
    }
  }

  checkCapacity(): void {
    if (this.reservation.nbrParticipant && this.selectedSpaceCapacity) {
      if (this.reservation.nbrParticipant > this.selectedSpaceCapacity) {
        this.notificationService.showError(
          `La capacité de « ${this.selectedSpaceName} » est de ${this.selectedSpaceCapacity} personnes. ` +
          `Réduisez le nombre de participants ou choisissez un autre espace.`
        );
      }
    }
  }

  participantsIsValid(): boolean {
    const basicValidation = this.reservation.nbrParticipant !== null && 
                          this.reservation.nbrParticipant > 0;
    
    if (!basicValidation) return false;
    
    // Only validate capacity if we successfully loaded it
    if (this.selectedSpaceCapacity !== null) {
      return (
        this.reservation.nbrParticipant !== null &&
        this.reservation.nbrParticipant <= this.selectedSpaceCapacity
      );
    }
    
    return true;
  }

  timeSlotIsValid(): boolean {
    if (!this.reservation.heureDebut || !this.reservation.heureFin) {
      return false;
    }
  
    try {
      const startDate = new Date(this.reservation.heureDebut);
      const endDate = new Date(this.reservation.heureFin);
      
      return !isNaN(startDate.getTime()) && 
             !isNaN(endDate.getTime()) && 
             endDate > startDate;
    } catch (e) {
      return false;
    }
  }

  isFormValid(form: NgForm): boolean {
    console.log('Form validation check:', {
  formValid: form.valid,
  responsableAction: this.reservation.responsableAction,
  intituleAction: this.reservation.intituleAction,
  nbrParticipant: this.reservation.nbrParticipant,
  cible: this.reservation.cible,
  emailValid: this.emailIsValid(),
  fonctionR: this.reservation.fonctionR,
  structure: this.reservation.structure,
  linkedInValid: this.linkedInIsValid(),
  description: this.reservation.description,
  timeSlotValid: this.timeSlotIsValid(),
  capacity: this.selectedSpaceCapacity
});
    return !!form.valid &&
           this.reservation.responsableAction.trim() !== '' &&
           this.reservation.intituleAction.trim() !== '' &&
           this.participantsIsValid() &&
           this.reservation.cible.trim() !== '' &&
           this.emailIsValid() &&
           this.reservation.fonctionR.trim() !== '' &&
           this.reservation.structure.trim() !== '' &&
           this.linkedInIsValid() &&
           this.reservation.description.trim() !== '' &&
           this.timeSlotIsValid();
  }

  async onSubmit(form: NgForm): Promise<void> {
    this.formSubmitted = true;
    this.errorMessage = null;
    this.isLoading = true;

    try {
      if (!this.isFormValid(form)) {
        throw new Error('Veuillez remplir correctement tous les champs obligatoires.');
      }

      if (!this.currentUser?.userId) {
        throw new Error('Session expirée, veuillez vous reconnecter.');
      }

      const reservationPayload = {
        ...this.reservation,
        nbrParticipant: Number(this.reservation.nbrParticipant),
        equipements: this.selectedEquipments,
        demandeurId: this.currentUser.userId,
        heureDebut: this.reservation.heureDebut,
        heureFin: this.reservation.heureFin
      };

      console.log('Submission payload:', reservationPayload);

      // Create reservation
      const createResponse = await lastValueFrom(
        this.reservationService.createReservation(reservationPayload).pipe(
          catchError(err => {
            throw new Error(`Échec de la création : ${this.extractErrorMessage(err)}`);
          })
        )
      );

      if (!createResponse?.id) {
        throw new Error('Réponse du serveur invalide (identifiant manquant).');
      }

      // Send to responsible
      await lastValueFrom(
        this.reservationService.sendReservation(createResponse.id).pipe(
          catchError(err => {
            throw new Error(`Échec de l'envoi : ${this.extractErrorMessage(err)}`);
          })
        )
      );

      this.notificationService.showSuccess('Réservation créée et envoyée avec succès !');
       setTimeout(() => {
      this.router.navigate(['/spaces']);
    }, 2000);
    } catch (error: any) {
      console.error('Submission error:', error);
      this.errorMessage = error.message;
      this.notificationService.showError(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  private extractErrorMessage(error: any): string {
    if (error instanceof HttpErrorResponse) {
      return error.error?.message || error.error?.error || error.message || 'Erreur serveur inconnue';
    }
    return error.message || 'Erreur inconnue';
  }

  goBack(): void {
    this.router.navigate(['/spaces']);
  }

  /** Back to the calendar of the same space to pick another slot. */
  changeSlot(): void {
    this.router.navigate(['/selection-calendar'], {
      queryParams: { etablissementId: this.reservation.etablissementId, espaceId: this.reservation.espaceId }
    });
  }

  showError(field: keyof typeof this.reservation): boolean {
    if (!this.formSubmitted) return false;
    
    const fieldValue = this.reservation[field];
    
    // Handle specific field validations
    switch (field) {
      case 'nbrParticipant':
        return !this.participantsIsValid();
      case 'emailR':
        return !this.emailIsValid();
      case 'lienLinkedInR':
        return !!this.reservation.lienLinkedInR && !this.linkedInIsValid();
      default:
        return fieldValue === '' || fieldValue === null;
    }
  }
}