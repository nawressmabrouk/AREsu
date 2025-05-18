import { CommonModule, DatePipe } from '@angular/common';
import { Component, Injectable } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateFnsAdapter } from '@angular/material-date-fns-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { isSameDay, parse, setDefaultOptions } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { AuthService } from '../services/auth/auth.service';
import { CalendarService } from '../services/calendar/calendar.service';
import { Etablissement, EtablissementService } from '../services/etablissement/etablissement.service';
import { Espace } from '../models/espace.model';
import { forkJoin } from 'rxjs';

@Injectable()
export class CustomDateFnsAdapter extends DateFnsAdapter {
  constructor() {
    super();
    setDefaultOptions({ locale: enUS });
  }
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule  
  ],
  selector: 'app-selection-calendar',
  templateUrl: './selection-calendar.component.html',
  styleUrls: ['./selection-calendar.component.scss'],
  providers: [
    DatePipe,
    { provide: DateAdapter, useClass: CustomDateFnsAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'P',
        },
        display: {
          dateInput: 'MMM d, yyyy',
          monthLabel: 'MMM',
          monthYearLabel: 'MMM yyyy',
          dateA11yLabel: 'PP',
          monthYearA11yLabel: 'MMMM yyyy',
        }
      }
    },
    { provide: MAT_DATE_LOCALE, useValue: enUS }
  ]
})
export class SelectionCalendarComponent {
  currentDate = new Date();
  timeSlots: string[] = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  selectedStartTime: string | null = null;
  selectedEndTime: string | null = null;
  isLoading = false;
  errorMessage = '';
  selectionState: 'idle' | 'start-selected' | 'end-selected' = 'idle';
  selectedDate: Date = new Date();
  reservedDates: Date[] = [];
  dateControl = new FormControl(new Date());
   isLoadingEtablissements = false;

 etablissementId: string | null = null;
  espaceId: string | null = null;
  selectedEtablissement: Etablissement | null = null;
  selectedEspace: Espace | null = null;


  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private calendarService: CalendarService,
    private etablissementService: EtablissementService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

 ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.etablissementId = params.get('etablissementId');
      this.espaceId = params.get('espaceId');
      
      if (this.etablissementId && this.espaceId) {
        this.loadEstablishmentAndSpace();
      } else {
        console.error('Missing required parameters in URL');
        // You might want to redirect back or show an error message
        this.errorMessage = 'Missing establishment or space information';
      }
    });
  }

  // Date filter function that disables weekends and reserved dates
  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    
    // Disable weekends (0 = Sunday, 6 = Saturday)
    if (date.getDay() === 0 || date.getDay() === 6) return false;
    
    // Disable dates before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    
    // Disable reserved dates
    return !this.isDateReserved(date);
  }

  // Check if a date is in the reserved dates list
  isDateReserved(date: Date): boolean {
    return this.reservedDates.some(reservedDate => 
      isSameDay(date, reservedDate)
    );
  }

  // Parse backend date strings ("Sat Mar 21") into Date objects
  private parseBackendDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
      // Add current year since it's missing in the backend format
      const currentYear = new Date().getFullYear();
      const fullDateStr = `${dateStr} ${currentYear}`;
      
      // Parse using date-fns with the correct format
      return parse(fullDateStr, 'EEE MMM dd yyyy', new Date());
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
      return null;
    }
  }
  
loadEstablishmentAndSpace(): void {
    forkJoin([
      this.etablissementService.getEtablissementById(this.etablissementId!),
      this.etablissementService.getEspaceById(this.espaceId!)
    ]).subscribe({
      next: ([etablissement, espace]) => {
        this.selectedEtablissement = etablissement;
        this.selectedEspace = espace;
        this.loadReservedDates();
      },
      error: (err: any) => {
        console.error('Error loading establishment or space:', err);
        this.errorMessage = 'Failed to load establishment or space information';
      }
    });
  }

/*onEtablissementChange(etablissement: Etablissement): void {
    this.selectedEtablissement = etablissement;
    this.loadReservedDates(); // Reload calendar when establishment changes
  }*/

 /* loadReservedDates(): void {
    this.isLoading = true;
    const etablissementId = this.selectedEtablissement?.id; 
      if (!etablissementId) {
    console.error('No establishment selected');
    return;
  }
    this.calendarService.getUnavailableDates(etablissementId).subscribe({
      next: (dateStrings: string[]) => {
        // Parse all valid dates and filter out empty/null values
        this.reservedDates = dateStrings
          .map(dateStr => this.parseBackendDate(dateStr))
          .filter((date): date is Date => date !== null);
        
        this.isLoading = false;
        // Force date control to revalidate with new reserved dates
        this.dateControl.updateValueAndValidity();
      },
      error: (err) => {
        console.error('Error loading reserved dates:', err);
        this.errorMessage = 'Failed to load reserved dates. Please try again later.';
        this.isLoading = false;
      }
    });
  }*/
 loadReservedDates(): void {
    if (!this.etablissementId || !this.espaceId) {
      console.warn('Cannot load reserved dates - missing IDs');
      return;
    }

    this.isLoading = true;
    this.calendarService.getUnavailableDates(this.etablissementId)
      .subscribe({
        next: (dateStrings: string[]) => {
          this.reservedDates = dateStrings
            .map(dateStr => this.parseBackendDate(dateStr))
            .filter((date): date is Date => date !== null);
          this.isLoading = false;
          this.dateControl.updateValueAndValidity();
        },
        error: (err) => {
          console.error('Error loading reserved dates:', err);
          this.errorMessage = 'Failed to load reserved dates. Please try again later.';
          this.isLoading = false;
        }
      });
  }
  isUnavailable(time: string): boolean {
    const hour = parseInt(time.split(':')[0], 10);
    const dateToCheck = new Date(this.selectedDate);
    dateToCheck.setHours(hour);
    return this.isDateReserved(dateToCheck);
  }

  selectToday(): void {
    this.selectedDate = new Date();
    this.dateControl.setValue(this.selectedDate);
    this.loadReservedDates();
  }

  handleSlotClick(time: string): void {
    if (this.isUnavailable(time)) {
      this.handleInvalidSelection(time);
      return;
    }

    switch (this.selectionState) {
      case 'idle':
        this.startSelection(time);
        break;
      case 'start-selected':
        if (time !== this.selectedStartTime) {
          this.completeSelection(time);
        }
        break;
      case 'end-selected':
        this.resetAndStartNewSelection(time);
        break;
    }
  }

  private handleInvalidSelection(time: string): void {
    const now = new Date();
    const currentHour = now.getHours();
    const selectedHour = parseInt(time.split(':')[0], 10);
    
    if (selectedHour < currentHour) {
      this.errorMessage = 'Cannot select past time slots.';
    } else {
      this.errorMessage = `The ${time} slot is already booked.`;
    }
    
    setTimeout(() => this.errorMessage = '', 3000);
  }

  private startSelection(time: string): void {
    this.selectedStartTime = time;
    this.selectionState = 'start-selected';
    this.errorMessage = '';
  }

  private completeSelection(time: string): void {
    this.selectedEndTime = time;
    
    if (this.validateTimeSelection()) {
      this.selectionState = 'end-selected';
    } else {
      this.errorMessage = 'End time must be after start time';
      this.selectedEndTime = null;
    }
  }

  private resetAndStartNewSelection(time: string): void {
    this.resetSelection();
    this.startSelection(time);
  }

  private validateTimeSelection(): boolean {
    if (!this.selectedStartTime || !this.selectedEndTime) return false;
    return parseInt(this.selectedEndTime.split(':')[0], 10) > 
           parseInt(this.selectedStartTime.split(':')[0], 10);
  }

  navigateToReservation(): void {
    if (!this.selectedStartTime || !this.selectedEndTime) {
      this.errorMessage = 'Please select a valid time range';
      return;
    }

    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd');
    const queryParams = {
      ...this.route.snapshot.queryParams,
      date: formattedDate,
      startTime: this.selectedStartTime,
      endTime: this.selectedEndTime
    };

    this.router.navigate(['/reservation-form'], { 
      queryParams,
      replaceUrl: true
    }).catch(err => {
      this.errorMessage = 'Failed to navigate to reservation form';
      console.error('Navigation error:', err);
    });
  }

  resetSelection(): void {
    this.selectedStartTime = null;
    this.selectedEndTime = null;
    this.errorMessage = '';
    this.selectionState = 'idle';
  }

  isSlotSelectedStart(time: string): boolean {
    return this.selectedStartTime === time;
  }

  isSlotSelectedEnd(time: string): boolean {
    return this.selectedEndTime === time;
  }

  isTimeInRange(time: string): boolean {
    if (!this.selectedStartTime || !this.selectedEndTime) return false;
    const currentHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(this.selectedStartTime.split(':')[0], 10);
    const endHour = parseInt(this.selectedEndTime.split(':')[0], 10);
    return currentHour > startHour && currentHour < endHour;
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
      this.selectedDate = event.value;
      this.dateControl.setValue(event.value);
    }
  }

  getCurrentTimePosition(): string {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slotHeight = 48;
    const position = (minutes - 8*60) / 30 * slotHeight;
    return `${position}px`;
  }
}