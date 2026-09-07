import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ApiClientService, ProblemDetails, UserProfile } from './api-client';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);

  readonly profile = signal<UserProfile | null>(null);
  readonly apiStatus = signal('verificando');
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  readonly isAuthenticated = signal(Boolean(localStorage.getItem('cointrol.accessToken')));

  checkHealth(): void {
    this.api.health().subscribe({
      next: health => this.apiStatus.set(health.status),
      error: () => this.apiStatus.set('offline')
    });
  }

  loadProfile(): void {
    if (!this.isAuthenticated()) {
      return;
    }

    this.api.getMe().subscribe({
      next: profile => this.profile.set(profile),
      error: error => {
        this.showError(this.errorMessage(error));
        this.clearLocalSession();
      }
    });
  }

  register(payload: Record<string, unknown>, onSuccess?: () => void): void {
    this.run(() => {
      this.api.register(payload).subscribe({
        next: () => {
          this.showMessage('Usuario criado. Agora faca login com o e-mail cadastrado.');
          onSuccess?.();
        },
        error: error => this.showError(this.errorMessage(error)),
        complete: () => this.loading.set(false)
      });
    });
  }

  login(email: string, password: string): void {
    this.run(() => {
      this.api.login(email, password).subscribe({
        next: tokens => {
          localStorage.setItem('cointrol.accessToken', tokens.accessToken);
          localStorage.setItem('cointrol.refreshToken', tokens.refreshToken);
          this.isAuthenticated.set(true);
          this.showMessage('Login realizado com sucesso.');
          this.loadProfile();
          this.router.navigateByUrl('/');
        },
        error: error => this.showError(this.errorMessage(error)),
        complete: () => this.loading.set(false)
      });
    });
  }

  logout(): void {
    const refreshToken = localStorage.getItem('cointrol.refreshToken') || '';
    this.clearLocalSession();

    if (refreshToken) {
      this.api.logout(refreshToken).subscribe();
    }

    this.router.navigateByUrl('/auth');
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
    if (error instanceof HttpErrorResponse) {
      const problem = error.error as ProblemDetails | undefined;
      const fieldErrors = problem?.fieldErrors ? Object.values(problem.fieldErrors).join(' ') : '';
      return fieldErrors || problem?.detail || problem?.title || `Erro ${error.status || ''}`.trim();
    }

    return 'Nao foi possivel concluir a operacao.';
  }

  private run(action: () => void): void {
    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    action();
  }

  private clearLocalSession(): void {
    localStorage.removeItem('cointrol.accessToken');
    localStorage.removeItem('cointrol.refreshToken');
    this.isAuthenticated.set(false);
    this.profile.set(null);
  }
}
