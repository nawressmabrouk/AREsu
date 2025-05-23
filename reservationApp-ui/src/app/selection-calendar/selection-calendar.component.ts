import { CommonModule, DatePipe } from '@angular/common';
import { Component, Injectable } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { format, isSameDay, parse, setDefaultOptions } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { forkJoin } from 'rxjs';
import { Espace } from '../models/espace.model';
import { AuthService } from '../services/auth/auth.service';
import { CalendarService } from '../services/calendar/calendar.service';
import { Etablissement, EtablissementService } from '../services/etablissement/etablissement.service';
import { ProfileComponent } from '../shared/components/profile/profile.component';
import { CalendarSlotDTO } from '../shared/interfaces/calendar-slot.dto';

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
    MatFormFieldModule,
    MatIconModule,
    ProfileComponent,
    MatButtonModule
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
  timeSlots: string[] = [];
  selectedStartTime: string | null = null;
  selectedEndTime: string | null = null;
  isLoading = false;
  errorMessage = '';
  selectionState: 'idle' | 'start-selected' | 'end-selected' = 'idle';
  selectedDate: Date = new Date();
  reservedDates: Date[] = [];
  dateControl = new FormControl(new Date());
  isLoadingEtablissements = false;
  currentUser: any;
  etablissementId: string | null = null;
  espaceId: string | null = null;
  selectedEtablissement: Etablissement | null = null;
  selectedEspace: Espace | null = null;
  availableSlots: CalendarSlotDTO[] | undefined;
  unavailableTimes: any;
  weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  monthDays: {date: Date, isCurrentMonth: boolean}[] = [];
  currentMonth = new Date();
// Add these to your component properties
currentTime: string = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
currentTimePosition: string = this.getCurrentTimePosition();
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
        this.errorMessage = 'Missing establishment or space information';
      }
    });
    this.generateMonthDays();
    this.generateTimeSlots();
  }

  private generateTimeSlots(): void {
    const slots = [];
    const startHour = 7; // 7 AM
    const endHour = 20;  // 8 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour && minute > 0) break; // Don't go past 8 PM
        
        const period = hour >= 12 ? 'PM' : 'AM';
        let displayHour = hour > 12 ? hour - 12 : hour;
        if (displayHour === 0) displayHour = 12; // Handle midnight
        
        slots.push(`${displayHour}:${minute.toString().padStart(2, '0')} ${period}`);
      }
    }
    
    this.timeSlots = slots;
  }

  private parseTime(time: string): { hours: number, minutes: number } {
    const [timePart, period] = time.split(' ');
    const [hoursStr, minutesStr] = timePart.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr || '0', 10);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return { hours, minutes };
  }

  isPreviousDayDisabled(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.selectedDate <= today;
  }

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

  isDateReserved(date: Date): boolean {
    return this.reservedDates.some(reservedDate => 
      isSameDay(date, reservedDate)
    );
  }
// Add this method to check if current time should be shown
shouldShowCurrentTime(time: string, index: number): boolean {
  if (!this.isToday()) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  // Parse the time slot (e.g., "7:00 AM" -> 7:00)
  const { hours: slotHour, minutes: slotMinute } = this.parseTime(time);
  const nextSlotHour = index < this.timeSlots.length - 1 
    ? this.parseTime(this.timeSlots[index + 1]).hours
    : 24;
  
  const slotStartMinutes = slotHour * 60 + slotMinute;
  const slotEndMinutes = nextSlotHour * 60;
  
  return currentTotalMinutes >= slotStartMinutes && 
         currentTotalMinutes < slotEndMinutes;
}

// Update your existing getCurrentTimePosition() method:
getCurrentTimePosition(): string {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const slotHeight = 48; // Height of each time slot in pixels
  const position = (minutes - (7 * 60)) * (slotHeight / 30); // 7 AM is start time, 30 min slots
  return `${position}px`;
}
  private parseBackendDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
      const currentYear = new Date().getFullYear();
      const fullDateStr = `${dateStr} ${currentYear}`;
      return parse(fullDateStr, 'EEE MMM dd yyyy', new Date());
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
      return null;
    }
  }
  
  // Add this to your component methods
isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
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
    const { hours, minutes } = this.parseTime(time);
    const dateToCheck = new Date(this.selectedDate);
    dateToCheck.setHours(hours, minutes, 0, 0);
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
    const { hours: selectedHour } = this.parseTime(time);
    const currentHour = now.getHours();
    
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
    
    const start = this.parseTime(this.selectedStartTime);
    const end = this.parseTime(this.selectedEndTime);
    
    return (end.hours > start.hours) || 
           (end.hours === start.hours && end.minutes > start.minutes);
  }

  navigateToReservation(): void {
    if (!this.selectedStartTime || !this.selectedEndTime) {
      this.errorMessage = 'Please select a valid time range';
      return;
    }

    const convertTo24Hour = (time: string) => {
      const { hours, minutes } = this.parseTime(time);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd');
    const queryParams = {
      ...this.route.snapshot.queryParams,
      date: formattedDate,
      startTime: convertTo24Hour(this.selectedStartTime),
      endTime: convertTo24Hour(this.selectedEndTime)
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
    
    const current = this.parseTime(time);
    const start = this.parseTime(this.selectedStartTime);
    const end = this.parseTime(this.selectedEndTime);
    
    const currentTotalMinutes = current.hours * 60 + current.minutes;
    const startTotalMinutes = start.hours * 60 + start.minutes;
    const endTotalMinutes = end.hours * 60 + end.minutes;
    
    return currentTotalMinutes > startTotalMinutes && 
           currentTotalMinutes < endTotalMinutes;
  }

  onDateChange(event: MatDatepickerInputEvent<Date>) {
    if (event.value) {
      this.selectedDate = event.value;
      this.dateControl.setValue(event.value);
    }
  }

  generateMonthDays() {
    this.monthDays = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDay = firstDay.getDay();
    const prevMonthDays = startDay > 0 ? startDay : 0;
    
    const totalCells = Math.ceil((lastDay.getDate() + prevMonthDays) / 7) * 7;
    const nextMonthDays = totalCells - (lastDay.getDate() + prevMonthDays);
    
    for (let i = prevMonthDays; i > 0; i--) {
      const date = new Date(year, month, -i + 1);
      this.monthDays.push({date, isCurrentMonth: false});
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      this.monthDays.push({date, isCurrentMonth: true});
    }
    
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      this.monthDays.push({date, isCurrentMonth: false});
    }
  }

  prevMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1,
      1
    );
    this.generateMonthDays();
  }

  nextMonth() {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1,
      1
    );
    this.generateMonthDays();
  }

  selectDay(date: Date) {
    if (this.isDayAvailable(date)) {
      this.selectedDate = date;
      this.dateControl.setValue(date);
      this.loadReservedDates();
    }
  }

  isDayAvailable(date: Date): boolean {
    return this.dateFilter(date);
  }

  isToday(): boolean {
    const today = new Date();
    return (
      this.selectedDate.getDate() === today.getDate() &&
      this.selectedDate.getMonth() === today.getMonth() &&
      this.selectedDate.getFullYear() === today.getFullYear()
    );
  }

  prevDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newDate >= today) {
      this.selectedDate = newDate;
      this.dateControl.setValue(newDate);
      this.loadReservedDates();
    }
  }

  nextDay() {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    this.selectedDate = newDate;
    this.dateControl.setValue(newDate);
    this.loadReservedDates();
  }

  navigateToSpaces() {
    this.router.navigate(['/spaces']);
  }
}