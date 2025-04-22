import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdOublieComponent } from './id-oublie.component';

describe('IdOublieComponent', () => {
  let component: IdOublieComponent;
  let fixture: ComponentFixture<IdOublieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdOublieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdOublieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
