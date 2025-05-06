import { TestBed } from '@angular/core/testing';

import { ReservationsubmissionService } from './reservationsubmission.service';

describe('ReservationsubmissionService', () => {
  let service: ReservationsubmissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservationsubmissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
