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
    httpMock.verify(); // Vérifie qu'aucune requête HTTP n'est en attente
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('#getAllEtablissements', () => {
    it('should return all establishments', () => {
      const mockEtablissements: Etablissement[] = [
        { id: '1', nom: 'Etab 1', type: 'Faculté', zone: 'Zone 1' },
        { id: '2', nom: 'Etab 2', type: 'Institut', zone: 'Zone 2' }
      ];

      service.getAllEtablissements().subscribe((etabs) => {
        expect(etabs).toEqual(mockEtablissements);
        expect(etabs.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/all`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEtablissements);
    });

    it('should handle HTTP errors', () => {
      service.getAllEtablissements().subscribe({
        next: () => fail('Expected an error, but got success'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/all`);
      req.flush('Internal Server Error', {
        status: 500,
        statusText: 'Server Error'
      });
    });
  });

  describe('#getEtablissementWithEspaces', () => {
    it('should return a specific establishment with its espaces', () => {
      const mockEtab: EtablissementWithEspaces = {
        id: '1',
        nom: 'Etab 1',
        type: 'Faculté',
        zone: 'Zone 1',
        espaces: [
          {
            id: '1',
            nom: 'Espace 1',
            type: 'Salle',
            capacite: 30,
            equipements: []
          }
        ]
      };

      service.getEtablissementWithEspaces('1').subscribe((etab) => {
        expect(etab).toEqual(mockEtab);
      });

      const req = httpMock.expectOne(`${baseUrl}/with-espaces/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockEtab);
    });
  });

  describe('#filterEtablissements', () => {
    it('should return filtered establishments based on criteria', () => {
      const criteria = { type: 'Faculté' };
      const mockFiltered: Etablissement[] = [
        { id: '1', nom: 'Etab 1', type: 'Faculté', zone: 'Zone 1' }
      ];

      service.filterEtablissements(criteria).subscribe((filtered) => {
        expect(filtered).toEqual(mockFiltered);
        expect(filtered.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/filter`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(criteria);
      req.flush(mockFiltered);
    });
  });
});
