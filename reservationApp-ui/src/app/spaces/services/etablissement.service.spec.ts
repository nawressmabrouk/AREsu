import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EtablissementService, Etablissement, EtablissementWithEspaces } from './etablissement.service';

describe('EtablissementService', () => {
  let service: EtablissementService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080/api/etablissements';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EtablissementService]
    });
    service = TestBed.inject(EtablissementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllEtablissements', () => {
    it('should return all establishments', () => {
      const mockEtablissements: Etablissement[] = [
        { id: '1', nom: 'Etab 1', type: 'Faculté', zone: 'Zone 1' },
        { id: '2', nom: 'Etab 2', type: 'Institut', zone: 'Zone 2' }
      ];

      service.getAllEtablissements().subscribe(etablissements => {
        expect(etablissements.length).toBe(2);
        expect(etablissements).toEqual(mockEtablissements);
      });

      const req = httpMock.expectOne(`${baseUrl}/all`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEtablissements);
    });

    it('should handle errors', () => {
      service.getAllEtablissements().subscribe({
        next: () => fail('should have failed with error'),
        error: (error) => expect(error.status).toBe(500)
      });

      const req = httpMock.expectOne(`${baseUrl}/all`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getEtablissementWithEspaces', () => {
    it('should return establishment with spaces', () => {
      const mockEtablissement: EtablissementWithEspaces = {
        id: '1',
        nom: 'Etab 1',
        type: 'Faculté',
        zone: 'Zone 1',
        espaces: [{ id: '1', nom: 'Espace 1', type: 'Salle', capacite: 30, equipements: [] }]
      };

      service.getEtablissementWithEspaces('1').subscribe(etablissement => {
        expect(etablissement).toEqual(mockEtablissement);
      });

      const req = httpMock.expectOne(`${baseUrl}/with-espaces/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEtablissement);
    });
  });
});