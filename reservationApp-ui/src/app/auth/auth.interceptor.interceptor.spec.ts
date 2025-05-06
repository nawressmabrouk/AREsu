import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor.interceptor';
import { AuthService } from '../services/auth/auth.service';
describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) => 
    TestBed.runInInjectionContext(() => authInterceptor(req, next));
  
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getToken']);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should add authorization header when token exists', () => {
   
    mockAuthService.getToken.and.returnValue('fake-token');
    
    const mockReq = new HttpRequest('GET', '/test');
    const nextHandler = jasmine.createSpy('next').and.callFake((req: HttpRequest<any>) => {
      expect(req.headers.get('Authorization')).toEqual('Bearer fake-token');
      return new HttpResponse();
    });

    interceptor(mockReq, nextHandler).subscribe();
    
    expect(nextHandler).toHaveBeenCalled();
  });

  it('should not modify request when no token exists', () => {
    mockAuthService.getToken.and.returnValue(null);
    
    const mockReq = new HttpRequest('GET', '/test');
    const nextHandler = jasmine.createSpy('next').and.callFake((req: HttpRequest<any>) => {
      expect(req.headers.has('Authorization')).toBeFalse();
      return new HttpResponse();
    });

    interceptor(mockReq, nextHandler).subscribe();
    
    expect(nextHandler).toHaveBeenCalled();
  });
});