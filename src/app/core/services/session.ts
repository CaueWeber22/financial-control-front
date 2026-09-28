import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, switchMap, tap } from 'rxjs';

import { ApiClientService, ProblemDetails, UserProfile } from './api-client';
import { CookieAuthService, isCsrfError } from './cookie-auth';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);
  private readonly cookieAuth = inject(CookieAuthService);
  private sessionChecked = false;
  private sessionRequest?: Observable<boolean>;

  readonly profile = signal<UserProfile | null>(null);
  readonly apiStatus = signal('verificando');
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly isAuthenticated = signal(false);

  constructor() {
    // Remove credentials persisted by older versions; cookies are managed only by the server.
    try {
      localStorage.removeItem('cointrol.accessToken');
      localStorage.removeItem('cointrol.refreshToken');
    } catch {
      // Storage may be disabled. Cookie authentication does not depend on it.
    }
    this.cookieAuth.expired.pipe(takeUntilDestroyed()).subscribe(() => {
      const wasAuthenticated = this.isAuthenticated();
      this.clearLocalSession();
      if (wasAuthenticated) {
        this.showError('Sua sessão expirou. Entre novamente.');
        void this.router.navigateByUrl('/auth');
      }
    });
  }

  ensureSession(): Observable<boolean> {
    if (this.sessionChecked) {
      return of(this.isAuthenticated());
    }
    if (!this.sessionRequest) {
      this.sessionRequest = this.api.getMe().pipe(
        tap(profile => this.acceptProfile(profile)),
        map(() => true),
        catchError(error => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.clearLocalSession();
          } else {
            this.showError(this.errorMessage(error));
          }
          return of(false);
        }),
        finalize(() => { this.sessionRequest = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.sessionRequest;
  }

  checkHealth(): void {
    this.api.health().subscribe({
      next: health => this.apiStatus.set(health.status),
      error: () => this.apiStatus.set('offline')
    });
  }

  loadProfile(): void {
    if (!this.isAuthenticated() || this.profile()) {
      return;
    }

    this.api.getMe().subscribe({
      next: profile => this.acceptProfile(profile),
      error: error => {
        this.showError(this.errorMessage(error));
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.clearLocalSession();
        }
      }
    });
  }

  register(payload: Record<string, unknown>, onSuccess?: () => void): void {
    this.run(() => {
      this.api.register(payload).pipe(finalize(() => this.loading.set(false))).subscribe({
        next: () => {
          this.showMessage('Usuario criado. Agora faca login com o e-mail cadastrado.');
          onSuccess?.();
        },
        error: error => this.showError(this.errorMessage(error))
      });
    });
  }

  login(email: string, password: string): void {
    this.run(() => {
      this.api.login(email, password).pipe(
        switchMap(() => this.api.getMe()),
        finalize(() => this.loading.set(false))
      ).subscribe({
        next: profile => {
          this.acceptProfile(profile);
          this.showMessage('Login realizado com sucesso.');
          this.router.navigateByUrl('/');
        },
        error: error => this.showError(this.errorMessage(error))
      });
    });
  }

  logout(): void {
    this.run(() => {
      this.api.logout().pipe(finalize(() => this.loading.set(false))).subscribe({
        next: () => {
          this.clearLocalSession();
          this.showMessage('Sessão encerrada.');
          void this.router.navigateByUrl('/auth');
        },
        // HttpOnly cookies cannot be cleared locally: do not claim success if the server failed.
        error: () => this.showError('Não foi possível encerrar a sessão no servidor. Tente novamente.')
      });
    });
  }

  showMessage(value: string): void {
    this.error.set('');
    this.message.set(value);
  }

  showError(value: string): void {
    this.message.set('');
    this.error.set(value);
    this.loading.set(false);
  }

  errorMessage(error: unknown): string {
    if (isCsrfError(error)) {
      return 'Não foi possível validar a sessão de segurança. Recarregue a página e verifique se o navegador permite os cookies da API.';
    }
    if (error instanceof HttpErrorResponse) {
      const problem = error.error as ProblemDetails | undefined;
      const fieldErrors = problem?.fieldErrors ? Object.values(problem.fieldErrors).join(' ') : '';
      return fieldErrors || problem?.detail || problem?.title || `Erro ${error.status || ''}`.trim();
    }

    return 'Nao foi possivel concluir a operacao.';
  }

  private run(action: () => void): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    action();
  }

  private clearLocalSession(): void {
    this.sessionChecked = true;
    this.isAuthenticated.set(false);
    this.profile.set(null);
  }

  private acceptProfile(profile: UserProfile): void {
    this.profile.set(profile);
    this.isAuthenticated.set(true);
    this.sessionChecked = true;
  }
}
