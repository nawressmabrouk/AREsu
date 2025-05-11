
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';
import { CalendarService } from '../services/calendar/calendar.service';
import { HolidayService } from '../services/calendar/holiday.service';
import { CalendarSlotDTO } from '../shared/interfaces/calendar-slot.dto';

interface Holiday {
  summary: string;
  start: {
    date?: string;       // For all-day events (format: 'yyyy-MM-dd')
    dateTime?: string;   // For timed events (ISO format)
  };
  description?: string;
  location?: string;
}


/*interface CalendarSlotDTO {
  heureDebut: Date;
  heureFin: Date;
  reserved?: boolean;
  etablissementReserved?: boolean;
  intituleAction?: string;
  espaceName?: string;
  responsableAction?: string;
  usersReservation?: boolean;
}*/

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [DatePipe]
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  selectedDate = new Date();
  timeSlots = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  unavailableSlots: string[] = [];
  holidays: Holiday[] = [];
  calendarSlots: CalendarSlotDTO[] = [];
  isLoading = false;
  errorMessage = '';

  selectedStartTime: string | null = null;
  selectedEndTime: string | null = null;
  selectionState: 'idle' | 'start-selected' | 'end-selected' = 'idle';

  
  espaceId!: string | null | undefined;
etablissementId!: string | null | undefined;

  userId: string = '';
  userRole: string = '';

  constructor(
    private router: Router,
    private calendarService: CalendarService,
    private route: ActivatedRoute,
    private holidayService: HolidayService,
    private datePipe: DatePipe,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(
      switchMap(params => {
        this.espaceId = params.get('espaceId');
        this.etablissementId = params.get('etablissementId');
  
        if (!this.espaceId || !this.etablissementId) {
          console.error('Missing espaceId or etablissementId in query params');
          return of(null);
        }
  
        this.loadUserData();
  
        if (!this.userId || !this.userRole) {
          console.error('User not authenticated');
          return of(null);
        }
  
        return this.loadData();
      })
    ).subscribe();
  }

  private loadCalendarSlots(): Observable<void> {
    // Clean the IDs first
    this.etablissementId = this.etablissementId?.replace(/_+$/, '').trim();
    this.espaceId = this.espaceId?.replace(/_+$/, '').trim();
  
    if (!this.etablissementId || !this.espaceId) {
      console.error('Invalid parameters after cleaning:', {
        etablissementId: this.etablissementId,
        espaceId: this.espaceId
      });
      this.errorMessage = 'Invalid establishment or space ID';
      return of(undefined);
    }
  
    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
    
    return this.calendarService.getCalendarView(
      this.etablissementId,
      this.espaceId,
      formattedDate,
      this.userId,
      this.userRole
    ).pipe(
      map((slots: CalendarSlotDTO[]) => {
        this.calendarSlots = slots.map(slot => ({
          ...slot,
          heureDebut: this.parseDate(slot.heureDebut),
          heureFin: this.parseDate(slot.heureFin)
        }));
        return undefined;
      }),
      catchError(err => {
        console.error('Failed to load calendar view:', err);
        this.errorMessage = err.message || 'Error loading calendar';
        return of(undefined);
      })
    );
  }
  
  private parseDate(date: string | Date): Date {
    return typeof date === 'string' ? new Date(date) : date;
  }
  selectToday(): void {
    this.selectedDate = new Date();
    this.loadData().subscribe();
  }
  
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = new Date(input.value);
    this.loadData().subscribe();
  }

  private loadUnavailableSlots(): Observable<void> {
    if (!this.espaceId) {
      console.error('Cannot load unavailable slots: espaceId is undefined');
      return of(undefined);
    }
  
    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd')!;
    
    return this.calendarService.getUnavailableSlotsForSpace(this.espaceId, formattedDate).pipe(
      map((slots: string[]) => {
        this.unavailableSlots = slots;
        return undefined;
      })
    );
  }

  private loadUserData(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.userId;
      this.userRole = user.role;
      
      console.log('User ID:', this.userId);
      console.log('User Role:', this.userRole);
    } else {
      console.error('No user data available');
      this.authService.logout().subscribe();
    }
  } 


  private loadData(): Observable<void> {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return of(undefined);
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    return forkJoin([
      this.loadUnavailableSlots(),
      this.loadHolidays(),
      this.loadCalendarSlots()
    ]).pipe(
      map(() => {
        this.isLoading = false;
        return undefined;
      }),
      catchError((err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load calendar data';
        console.error('Error loading data:', err);
        if (err.status === 401) {
          this.authService.logout().subscribe();
        }
        return of(undefined);
      })
    );
  }
  
 
 
 
 
 
 
 
 
 
 
 
 
  private loadHolidays(): Observable<void> {
    const formattedDate = this.datePipe.transform(this.selectedDate, 'yyyy-MM-dd');
    if (!formattedDate) {
      return of(undefined);
    }
  
    return this.holidayService.getPublicHolidays(formattedDate, formattedDate).pipe(
      map((holidays: Holiday[]) => {
        this.holidays = holidays || [];
        return undefined;
      }),
      catchError(err => {
        console.error('Error loading holidays:', err);
        this.errorMessage = 'Failed to load holiday information';
        return of(undefined);
      })
    );
  }
  
  
  
  
  
  
  
  
  
  
  
  isHoliday(time: string): boolean {
    if (!this.holidays?.length) return false;
    
    const hour = parseInt(time.split(':')[0], 10);
    return this.holidays.some(holiday => {
      try {
        const start = holiday?.start || {};
        const dateStr = start.date || start.dateTime;
        if (!dateStr) return false;
  
        const holidayDate = new Date(dateStr);
        if (isNaN(holidayDate.getTime())) return false;
  
        return (
          holidayDate.getFullYear() === this.selectedDate.getFullYear() &&
          holidayDate.getMonth() === this.selectedDate.getMonth() &&
          holidayDate.getDate() === this.selectedDate.getDate() &&
          (!start.dateTime || holidayDate.getHours() === hour) // Only check hour for timed events
        );
      } catch {
        return false;
      }
    });
  }
  
  
getHolidayTimeDisplay(holiday: Holiday): string {
  if (!holiday?.start) return 'All day';
  
  try {
    const dateStr = holiday.start.dateTime || holiday.start.date;
    if (!dateStr) return 'All day';
    
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'All day' : this.datePipe.transform(date, 'shortTime') || '';
  } catch {
    return 'All day';
  }
} 
  
  
  
  
  
  
  
  
  
  
 
  isUnavailable(time: string): boolean {
    const hour = parseInt(time.split(':')[0], 10);
    return this.calendarSlots.some(slot => {
      // Convert to Date if necessary
      const start = typeof slot.heureDebut === 'string' ? new Date(slot.heureDebut) : slot.heureDebut;
      const end = typeof slot.heureFin === 'string' ? new Date(slot.heureFin) : slot.heureFin;
      
      const startHour = start.getHours();
      const endHour = end.getHours();
      return hour >= startHour && hour < endHour && slot.reserved;
    });
  }
 
 

  getCurrentTimeLinePosition(): string {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const pxPerMinute = 50 / 60;
    return `${minutes * pxPerMinute}px`;
  }

  handleSlotClick(time: string): void {
    if (this.isHoliday(time) || this.isUnavailable(time)) {
      this.handleInvalidSelection(time);
      return;
    }

    switch (this.selectionState) {
      case 'idle':
        this.startSelection(time);
        break;
      case 'start-selected':
        this.completeSelection(time);
        break;
      case 'end-selected':
        this.resetAndStartNewSelection(time);
        break;
    }
  }


  private handleInvalidSelection(time: string): void {
    if (this.isHoliday(time)) {
      const holiday = this.holidays.find(h => {
        const dateStr = h.start.date || h.start.dateTime;
        if (!dateStr) return false;
        const holidayDate = new Date(dateStr);
        return holidayDate.getHours() === parseInt(time.split(':')[0], 10);
      });
      alert(`Cannot book on holiday: ${holiday?.summary || 'Holiday'}`);
    } else {
      alert(`The ${time} slot is already booked.`);
    }
  }

  private startSelection(time: string): void {
    this.selectedStartTime = time;
    this.selectedEndTime = null;
    this.selectionState = 'start-selected';
  }

  private completeSelection(time: string): void {
    if (time === this.selectedStartTime) return;
  
    this.selectedEndTime = time;
  
    if (!this.validateTimeRange()) {
      alert('End time must be after start time');
      this.resetSelection();
      return;
    }
  
    this.selectionState = 'end-selected';
  }

  private resetAndStartNewSelection(time: string): void {
    this.resetSelection();
    this.startSelection(time);
  }

  validateTimeRange(): boolean {
    if (!this.selectedStartTime || !this.selectedEndTime) return false;
    
    const startHour = parseInt(this.selectedStartTime.split(':')[0], 10);
    const endHour = parseInt(this.selectedEndTime.split(':')[0], 10);
    
    return endHour > startHour;
  }

  resetSelection(): void {
    this.selectedStartTime = null;
    this.selectedEndTime = null;
    this.selectionState = 'idle';
  }

  isTimeInRange(time: string): boolean {
    if (!this.selectedStartTime) return false;
  
    const currentHour = parseInt(time.split(':')[0], 10);
    const startHour = parseInt(this.selectedStartTime.split(':')[0], 10);
  
    if (this.selectedEndTime) {
      const endHour = parseInt(this.selectedEndTime.split(':')[0], 10);
      return currentHour >= startHour && currentHour <= endHour;
    }
  
    return currentHour === startHour;
  }

  navigateToReservation(): void {
    if (!this.selectedStartTime || !this.selectedEndTime) {
      console.error('Cannot navigate - missing time selection');
      return;
    }
  
    const currentParams = this.route.snapshot.queryParams;
    
    const queryParams = {
      ...currentParams,
      date: this.selectedDate.toISOString(),
      startTime: this.selectedStartTime,
      endTime: this.selectedEndTime
    };
  
    this.router.navigate(['/reservation-form'], { 
      queryParams,
      replaceUrl: true
    }).catch((err: any) => {
      console.error('Navigation error:', err);
      alert('Failed to navigate to reservation form');
    });
  }
}
