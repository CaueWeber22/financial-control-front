import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Transaction } from '../../../../core/services/api-client';
import { FinanceStoreService } from '../../../../core/services/finance-store';
import { MetricCard } from '../../components/metric-card/metric-card';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, MetricCard],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  protected readonly store = inject(FinanceStoreService);
  protected readonly monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  protected money(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  }

  protected isExpense(type: Transaction['type']): boolean {
    return type === 'EXPENSE' || type === 'TRANSFER_OUT';
  }

  protected amountWithSignal(value: number, type: Transaction['type']): string {
    return `${this.isExpense(type) ? '−' : '+'} ${this.money(value)}`;
  }

  protected dateLabel(value: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T12:00:00`));
  }

  protected statusLabel(status: Transaction['status']): string {
    return { CLEARED: 'Confirmado', PENDING: 'Pendente', CANCELED: 'Cancelado' }[status];
  }
}
