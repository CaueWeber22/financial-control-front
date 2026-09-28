import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, defer, finalize, firstValueFrom, from, map, of, shareReplay, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CsrfToken {
  token: string;
  headerName: string;
}

export function isCsrfError(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 403 && error.error?.code === 'CSRF_INVALID';
}

@Injectable({ providedIn: 'root' })
export class CookieAuthService {
  // Bypass the interceptor to avoid recursively refreshing authentication or fetching CSRF.
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = environment.apiBaseUrl;
  private csrfRequest?: Observable<CsrfToken>;
  private refreshRequest?: Observable<void>;
  readonly expired = new Subject<void>();

  csrf(): Observable<CsrfToken> {
    if (!this.csrfRequest) {
      this.csrfRequest = this.http.get<CsrfToken>(`${this.baseUrl}/auth/csrf`, {
        withCredentials: true,
        timeout: 30000
      }).pipe(
        map(value => {
          if (!value.token || value.headerName !== 'X-CSRF-TOKEN') {
            throw new Error('Resposta CSRF incompatível com o contrato da API.');
          }
          return value;
        }),
        catchError(error => {
          this.invalidateCsrf();
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.csrfRequest;
  }

  invalidateCsrf(): void {
    this.csrfRequest = undefined;
  }

  waitForRefresh(): Observable<void> {
    return this.refreshRequest ?? of(undefined);
  }

  login(email: string, password: string): Observable<void> {
    return this.withAuthLock(() => this.mutate('login', { email, password }).pipe(
      switchMap(() => this.afterRotation())
    ));
  }

  logout(): Observable<void> {
    return this.withAuthLock(() => this.mutate('logout', null));
  }

  refresh(): Observable<void> {
    if (!this.refreshRequest) {
      this.refreshRequest = this.withAuthLock(() => {
        this.invalidateCsrf();
        // A different tab may already have renewed the shared cookies while we waited.
        return this.http.get(`${this.baseUrl}/users/me`, {
          withCredentials: true,
          timeout: 30000
        }).pipe(
          map(() => undefined),
          catchError(error => {
            if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
              return throwError(() => error);
            }
            return this.mutate('refresh', null);
          }),
          switchMap(() => this.afterRotation())
        );
      }).pipe(
        catchError(error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.expire();
          }
          return throwError(() => error);
        }),
        finalize(() => { this.refreshRequest = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.refreshRequest;
  }

  expire(): void {
    this.invalidateCsrf();
    this.expired.next();
  }

  private afterRotation(): Observable<void> {
    this.invalidateCsrf();
    return this.csrf().pipe(map(() => undefined));
  }

  private mutate(action: string, body: unknown, retried = false): Observable<void> {
    return this.csrf().pipe(
      switchMap(csrf => this.http.post<void>(`${this.baseUrl}/auth/${action}`, body, {
        withCredentials: true,
        timeout: 30000,
        headers: { [csrf.headerName]: csrf.token }
      }).pipe(
        catchError(error => {
          if (!retried && isCsrfError(error)) {
            this.invalidateCsrf();
            return this.mutate(action, body, true);
          }
          return throwError(() => error);
        })
      ))
    );
  }

  private withAuthLock(action: () => Observable<void>): Observable<void> {
    return defer(() => {
      if (typeof navigator !== 'undefined' && navigator.locks) {
        return from(navigator.locks.request(`cointrol-auth:${this.baseUrl}`, () => firstValueFrom(action())))
          .pipe(map(() => undefined));
      }
      // Older browsers still share a single refresh within this tab.
      return action();
    });
  }
}
