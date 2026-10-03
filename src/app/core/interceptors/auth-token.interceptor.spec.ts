import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authTokenInterceptor } from './auth-token.interceptor';

describe('authTokenInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor])),
        provideHttpClientTesting()
      ]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-token');
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it.each([
    environment.apiBaseUrl,
    `${environment.apiBaseUrl}/users/me`,
    `${environment.apiBaseUrl}?page=0`
  ])('uses cookies without a stored Bearer token for the configured API: %s', url => {
    client.get(url).subscribe();
    const request = http.expectOne(url);
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(Storage.prototype.getItem).not.toHaveBeenCalled();
    request.flush({});
  });

  it.each([
    environment.healthUrl,
    'https://example.com/api/v1/users/me',
    `${environment.apiBaseUrl}-other/users/me`,
    '/api/v10/users/me'
  ])('does not send the token outside the configured API: %s', url => {
    client.get(url).subscribe();
    const request = http.expectOne(url);
    expect(request.request.withCredentials).toBe(false);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('does not add authorization when there is no token', () => {
    vi.mocked(Storage.prototype.getItem).mockReturnValue(null);
    const url = `${environment.apiBaseUrl}/users/me`;
    client.get(url).subscribe();
    const request = http.expectOne(url);
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
