import { Component } from '@angular/core';
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
  styleUrls: ['./reservations-calendar.component.scss']
})
export class ReservationsCalendarComponent {
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
    const dateString = format(this.currentDate, 'yyyy-MM-dd');
    
    forkJoin([
      this.calendarService.getConfirmedEvents(),
      this.calendarService.getUnconfirmedEvents()
    ]).subscribe({
      next: ([confirmedSlots, unconfirmedSlots]) => {
        this.slots = [...confirmedSlots, ...unconfirmedSlots]
          .map(slot => ({
            ...slot,
            heureDebut: parseISO(slot.heureDebut.toString()),
            heureFin: parseISO(slot.heureFin.toString())
          }));
        
        this.loading = false;
        
        // Auto-select today if it has slots
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
    
    // Split into weeks
    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }
  }
  
getSlotsForDay(day: Date): CalendarSlotDTO[] {
  return this.slots.filter(slot => 
    isSameDay(slot.heureDebut, day)
  );
}
  isSameMonth(day: Date): boolean {
    return isSameMonth(day, this.currentDate);
  }

  isToday(day: Date): boolean {
    return isToday(day);
  }

  isSelected(day: Date): boolean {
    if (!this.selectedDay) return false;
    return isSameDay(day, this.selectedDay);
  }

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
  // Additional service integration methods
  getTimeSlots(): void {
    if (!this.selectedDate) return;
    
    const dateString = format(this.selectedDate, 'yyyy-MM-dd');
    this.calendarService.getTimeSlots(dateString).subscribe({
      next: (slots) => {
        this.slots = slots;
      },
      error: (err) => {
        console.error('Failed to load time slots:', err);
      }
    });
  }
/*
  confirmSelectedSlot(): void {
    if (this.selectedSlot && this.selectedSlot.id) {
      this.calendarService.confirmEvent(this.selectedSlot.id).subscribe({
        next: (confirmedSlot) => {
          const index = this.slots.findIndex(s => s.id === confirmedSlot.id);
          if (index !== -1) {
            this.slots[index] = confirmedSlot;
          }
          this.selectedSlot = confirmedSlot;
        },
        error: (err) => {
          console.error('Failed to confirm slot:', err);
        }
      });
    }
*/

  // Navigation methods
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

  clearSelection(): void {
    this.selectedDay = null;
    this.selectedSlot = null;
    this.selectedDate = null;
  }
  get selectedDaySlots(): CalendarSlotDTO[] {
  if (!this.selectedDay) return [];
  return this.getSlotsForDay(this.selectedDay);
}

 getSlotTime(slot: CalendarSlotDTO): string {
   return format(slot.heureDebut, 'HH:mm');
 }
}