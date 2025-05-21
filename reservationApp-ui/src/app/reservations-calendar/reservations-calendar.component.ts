import { Component, Input , OnChanges , SimpleChanges  } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { forkJoin } from 'rxjs';
import { CalendarSlotDTO } from '../shared/interfaces/calendar-slot.dto';
import { CalendarService } from '../services/calendar/calendar.service';
import { StatusReservation } from '../models/reservation.model';
@Component({
  selector: 'app-reservations-calendar',
  templateUrl: './reservations-calendar.component.html',
  styleUrls: ['./reservations-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ReservationsCalendarComponent implements OnChanges {
    // Input property for establishment ID
  @Input() etablissementId: string = '';
  // Calendar configuration
  currentDate = new Date();
  weeks: Date[][] = [];
  slots: CalendarSlotDTO[] = [];
  loading = false;
   public StatusReservation = StatusReservation;
  // Selection state
  selectedDay: Date | null = null;
  public selectedSlot: CalendarSlotDTO | null = null;
  selectedDate: Date | null = null;

  constructor(private calendarService: CalendarService) { }
   ngOnChanges(changes: SimpleChanges): void {
    if (changes['etablissementId'] && this.etablissementId) {
      this.loadSlots();
    }
  }
  ngOnInit(): void {
      console.log('📅 Using calendar for établissement:', this.etablissementId);
    this.generateCalendar();
    this.loadSlots();
  }

  /*private loadSlots(): void {
    this.loading = true;
    
    forkJoin([
      this.calendarService.getConfirmedEvents(),
      this.calendarService.getUnconfirmedEvents()
    ]).subscribe({
      next: ([confirmedSlots, unconfirmedSlots]) => {
        this.slots = [...confirmedSlots, ...unconfirmedSlots]
          .map(slot => ({
            ...slot,
            heureDebut: typeof slot.heureDebut === 'string' ? parseISO(slot.heureDebut) : new Date(slot.heureDebut),
            heureFin: typeof slot.heureFin === 'string' ? parseISO(slot.heureFin) : new Date(slot.heureFin)
          }));
        
        this.loading = false;
        
        const todaySlots = this.getSlotsForDay(new Date());
        if (todaySlots.length > 0) {
          this.selectDay(new Date());
        }
      },
      error: (err) => {
        console.error('Failed to load slots:', err);
        this.loading = false;
      }
    });
  }*/

public loadSlots(): void {
  if (!this.etablissementId) {
    console.warn('Cannot load slots - no etablissementId');
    return;
  }

  this.loading = true;
  
  forkJoin([
    this.calendarService.getConfirmedEvents(this.etablissementId),
    this.calendarService.getUnconfirmedEvents(this.etablissementId)
  ]).subscribe({
    next: ([confirmedSlots, pendingSlots]) => {
      console.log('Loaded slots:', { confirmedSlots, pendingSlots });
      
      const merged: CalendarSlotDTO[] = [
        ...confirmedSlots.map(s => ({
          ...s,
          reserved: true,
          selectable: false,
          statut: StatusReservation.ACCEPTEE
        })),
        ...pendingSlots.map(s => ({
          ...s,
          reserved: false,
          selectable: true,
          statut: StatusReservation.EN_ATTENTE
        }))
      ];

      this.slots = merged.map(slot => ({
        ...slot,
        heureDebut: this.ensureDate(slot.heureDebut),
        heureFin: this.ensureDate(slot.heureFin)
      }));

      this.loading = false;
    },
    error: err => {
      console.error('Error loading slots:', err);
      this.loading = false;
    }
  });
}

private ensureDate(date: string | Date): Date {
  return typeof date === 'string' ? parseISO(date) : date;
}
  generateCalendar(): void {
    const firstDay = startOfWeek(startOfMonth(this.currentDate));
    const lastDay = endOfWeek(endOfMonth(this.currentDate));
    const days = eachDayOfInterval({ start: firstDay, end: lastDay });
    
    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }
  }

  // Calendar Navigation
  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
    this.loadSlots();
    this.clearSelection();
  }

  nextMonth(): void {
    this.currentDate = addMonths(this.currentDate, 1);
    this.generateCalendar();
    this.loadSlots();
    this.clearSelection();
  }

  prevMonth(): void {
    this.currentDate = subMonths(this.currentDate, 1);
    this.generateCalendar();
    this.loadSlots();
    this.clearSelection();
  }

  // Slot Handling
getSlotsForDay(day: Date): CalendarSlotDTO[] {
  return this.slots.filter((slot): slot is CalendarSlotDTO & { heureDebut: Date } =>
    slot.heureDebut instanceof Date && isSameDay(slot.heureDebut, day)
  );
}


confirmSelectedSlot(): void {
  if (!this.selectedSlot?.id) return;

  this.calendarService.confirmEvent(this.selectedSlot.id)
    .subscribe({
      next: () => {
        // reload all slots from the server
        this.loadSlots();
        // clear selection (so the detail pane goes away, or you can re‐select it)
        this.clearSelection();
      },
      error: err => console.error('Failed to confirm slot:', err)
    });
}


  // Date Helpers
  isSameMonth(day: Date): boolean {
    return isSameMonth(day, this.currentDate);
  }

  isToday(day: Date): boolean {
    return isToday(day);
  }

  isSelected(day: Date): boolean {
    return !!this.selectedDay && isSameDay(day, this.selectedDay);
  }

  // Selection Handling
  selectDay(day: Date): void {
    this.selectedDay = day;
    this.selectedSlot = null;
    this.selectedDate = day;
  }

selectSlot(slot: CalendarSlotDTO) {
  this.selectedSlot = slot;
  // assert to Date
  this.selectedDate = slot.heureDebut as Date;
  this.selectedDay   = slot.heureDebut as Date;
}

  clearSelection(): void {
    this.selectedDay = null;
    this.selectedSlot = null;
    this.selectedDate = null;
  }

  get selectedDaySlots(): CalendarSlotDTO[] {
    return this.selectedDay ? this.getSlotsForDay(this.selectedDay) : [];
  }

  // Display Formatting
  getSlotTime(slot: CalendarSlotDTO): string {
    return slot.heureDebut ? format(slot.heureDebut, 'HH:mm') : '';
  }

  getFormattedTime(date: Date): string {
  return date ? format(date, 'HH:mm') : '';
}

getFormattedTimeRange(start: Date, end: Date): string {
  if (!start || !end) return '';
  return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
}

  private updateCalendarView(): void {
    // Update your calendar display based on reservations
    this.generateCalendar();
    if (this.selectedDay) {
      this.selectDay(this.selectedDay); // Refresh selected day
    }
  }

}