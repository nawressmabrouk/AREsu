import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
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
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { StatusReservation } from '../models/reservation.model';
import { CalendarService } from '../services/calendar/calendar.service';
import { CalendarSlotDTO } from '../shared/interfaces/calendar-slot.dto';

@Component({
  selector: 'app-reservations-calendar',
  templateUrl: './reservations-calendar.component.html',
  styleUrls: ['./reservations-calendar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ReservationsCalendarComponent implements OnChanges, OnDestroy {
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
  espaceNom?: string;
  // Cleanup subject for subscriptions
  private destroy$ = new Subject<void>();
  expandedDays: Set<string> = new Set();


  constructor(private calendarService: CalendarService) { }

  // Cleanup to prevent memory leaks
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle input changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['etablissementId'] && this.etablissementId) {
      this.loadEspaceNom();
      this.loadSlots();
    }
  }

  // Initialize component
  ngOnInit(): void {
    console.log('Using calendar for établissement:', this.etablissementId);
    this.generateCalendar();
    this.loadSlots();
  }

  // Load the space name for display
  private loadEspaceNom(): void {
    if (!this.etablissementId) return;
    
    this.calendarService.getEspaceNom(this.etablissementId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.espaceNom = response.espaceNom;
        },
        error: (err) => {
          console.error('Failed to load espace name:', err);
          this.espaceNom = '';
        }
      });
  }


// Check if a day is expanded
isDayExpanded(day: Date): boolean {
  return this.expandedDays.has(day.toISOString());
}

toggleDayExpansion(day: Date): void {
  const dayKey = day.toISOString();
  if (this.expandedDays.has(dayKey)) {
    this.expandedDays.delete(dayKey);
  } else {
    this.expandedDays.add(dayKey);
  }
}

// Load both confirmed and pending reservation slots
public loadSlots(): void {
  if (!this.etablissementId) return;

  this.loading = true;
  
  forkJoin([
    this.calendarService.getConfirmedEvents(this.etablissementId),
    this.calendarService.getUnconfirmedEvents(this.etablissementId)
  ]).subscribe({
    next: ([confirmedSlots, pendingSlots]) => {
      const merged: CalendarSlotDTO[] = [
        ...confirmedSlots.map(s => ({
          ...s,
          reserved: true,
          selectable: false,
          statut: StatusReservation.ACCEPTEE,
          espaceNom: s.espaceNom  // Ensure espaceNom is included
        })),
        ...pendingSlots.map(s => ({
          ...s,
          reserved: false,
          selectable: true,
          statut: StatusReservation.EN_ATTENTE,
          espaceNom: s.espaceNom  // Ensure espaceNom is included
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
          this.loadSlots();
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
  
  // Auto-expand day when clicked if there are multiple slots
  if (this.getSlotsForDay(day).length > 2) {
    this.toggleDayExpansion(day);
  }
}

  selectSlot(slot: CalendarSlotDTO) {
    this.selectedSlot = slot;
    this.selectedDate = slot.heureDebut as Date;
    this.selectedDay = slot.heureDebut as Date;
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
    this.generateCalendar();
    if (this.selectedDay) {
      this.selectDay(this.selectedDay);
    }
  }
}