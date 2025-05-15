import { Component } from '@angular/core';
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

@Component({
  selector: 'app-reservations-calendar',
  templateUrl: './reservations-calendar.component.html',
  styleUrls: ['./reservations-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ReservationsCalendarComponent {
  // Calendar configuration
  currentDate = new Date();
  weeks: Date[][] = [];
  slots: CalendarSlotDTO[] = [];
  loading = false;
  
  // Selection state
  selectedDay: Date | null = null;
  public selectedSlot: CalendarSlotDTO | null = null;
  selectedDate: Date | null = null;

  constructor(private calendarService: CalendarService) { }

  ngOnInit(): void {
    this.generateCalendar();
    this.loadSlots();
  }

  private loadSlots(): void {
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
    return this.slots.filter(slot => 
      slot.heureDebut && isSameDay(slot.heureDebut, day)
    );
  }

  confirmSelectedSlot(): void {
    if (this.selectedSlot && this.selectedSlot.id) {
      this.calendarService.confirmEvent(this.selectedSlot.id).subscribe({
        next: (confirmedSlot) => {
          const index = this.slots.findIndex(s => s.id === confirmedSlot.id);
          if (index !== -1) {
            this.slots[index] = {
              ...confirmedSlot,
              heureDebut: new Date(confirmedSlot.heureDebut),
              heureFin: new Date(confirmedSlot.heureFin)
            };
          }
          this.selectedSlot = this.slots[index];
        },
        error: (err) => {
          console.error('Failed to confirm slot:', err);
        }
      });
    }
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

  selectSlot(slot: CalendarSlotDTO): void {
    this.selectedSlot = slot;
    this.selectedDate = slot.heureDebut;
    this.selectedDay = slot.heureDebut;
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

}