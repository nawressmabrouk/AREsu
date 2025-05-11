import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsCalendarComponent } from './reservations-calendar.component';

describe('ReservaionsCalendarComponent', () => {
  let component: ReservationsCalendarComponent;
  let fixture: ComponentFixture<ReservationsCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationsCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
