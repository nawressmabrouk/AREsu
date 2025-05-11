import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionCalendarComponent } from './selection-calendar.component';

describe('SelectionCalendarComponent', () => {
  let component: SelectionCalendarComponent;
  let fixture: ComponentFixture<SelectionCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectionCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
