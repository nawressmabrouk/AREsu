import { CommonModule, DatePipe } from '@angular/common';
import { Component, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateFnsAdapter } from '@angular/material-date-fns-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { setDefaultOptions } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { AuthService } from '../services/auth/auth.service';
import { CalendarService } from '../services/calendar/calendar.service';

@Injectable()
export class CustomDateFnsAdapter extends DateFnsAdapter {
  constructor() {
    super();
    // Set locale globally for date-fns
    setDefaultOptions({ locale: enUS });
  }
}
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    // 2. Provide the custom adapter
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
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private calendarService: CalendarService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.loadReservedDates();
  }

 dateFilter = (date: Date | null): boolean => {
  if (!date) return false;
  
  // Disable weekends
  if (date.getDay() === 0 || date.getDay() === 6) return false;

  // Disable reserved dates using ISO string comparison
  const dateISO = date.toISOString().split('T')[0];
  return !this.reservedDates.some(d => 
    d.toISOString().split('T')[0] === dateISO
  );
}

  isSlotSelectedStart(time: string): boolean {
    return this.selectedStartTime === time;
  }

  loadReservedDates(): void {
    this.isLoading = true;
    this.calendarService.getUnavailableDates().subscribe({
      next: (dateStrings: string[]) => {
        this.reservedDates = dateStrings.map(dateStr => new Date(dateStr));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reserved dates:', err);
        this.errorMessage = 'Failed to load reserved dates. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  selectToday(): void {
    this.selectedDate = new Date();
    this.loadReservedDates();
  }

  isTimeInRange(time: string): boolean {
    if (!this.selectedStartTime || !this.selectedEndTime) return false;
    const currentHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(this.selectedStartTime.split(':')[0], 10);
    const endHour = parseInt(this.selectedEndTime.split(':')[0], 10);
    return currentHour > startHour && currentHour < endHour;
  }

  getCurrentTimeLinePosition(): string {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const pxPerMinute = 50 / 60;
    return `${minutes * pxPerMinute}px`;
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
      // Only update end time if it's different from start
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
    // Removed automatic navigation here
  } else {
    this.errorMessage = 'End time must be after start time';
    // Don't reset the entire selection, just clear the invalid end time
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

    // Format the date using DatePipe
  const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd');
    
     const queryParams = {
    ...this.route.snapshot.queryParams,
    date: formattedDate,  // Add formatted date
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

  isSlotSelectedEnd(time: string): boolean {
    return this.selectedEndTime === time;
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
      this.selectedDate = event.value;
    }
  }

isUnavailable(time: string): boolean {
  const hour = parseInt(time.split(':')[0], 10);
  const selectedDateISO = this.selectedDate.toISOString().split('T')[0];
  
  return this.reservedDates.some(d => {
    const reservedDateISO = d.toISOString().split('T')[0];
    return reservedDateISO === selectedDateISO && d.getHours() === hour;
  });
}


  getCurrentTimePosition(): string {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const slotHeight = 48;
    const position = (minutes - 8*60) / 30 * slotHeight;
    return `${position}px`;
  }
}



