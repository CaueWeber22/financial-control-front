import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { FinanceStoreService } from '../../core/services/finance-store';
import { SessionService } from '../../core/services/session';
import { ThemeService } from '../../core/services/theme';
import { HealthPill } from '../../shared/components/health-pill/health-pill';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HealthPill, Toast],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly session = inject(SessionService);
  protected readonly store = inject(FinanceStoreService);
  protected readonly theme = inject(ThemeService);
  protected readonly navigation = [
    { path: '/', label: 'Resumo' },
    { path: '/accounts', label: 'Contas' },
    { path: '/categories', label: 'Categorias' },
    { path: '/transactions', label: 'Lancamentos' },
    { path: '/transfers', label: 'Transferencias' },
    { path: '/summary', label: 'Relatórios' },
  ];
  protected readonly todayLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());

  constructor() {
    this.session.checkHealth();
    this.store.loadWorkspace();
  }

  protected logout(): void {
    this.session.logout();
  }
}
