import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtablissementCardComponent } from './etablissement-card.component';

describe('EtablissementCardComponent', () => {
  let component: EtablissementCardComponent;
  let fixture: ComponentFixture<EtablissementCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtablissementCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EtablissementCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
