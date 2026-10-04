import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FinanceStoreService } from '../../../../core/services/finance-store';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-transactions-page',
  imports: [ReactiveFormsModule],
  templateUrl: './transactions-page.html',
  styleUrl: './transactions-page.scss',
})
export class TransactionsPage {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  protected readonly store = inject(FinanceStoreService);

  protected readonly transactionForm = this.fb.nonNullable.group({
    accountId: ['', Validators.required],
    categoryId: ['', Validators.required],
    type: ['EXPENSE', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    status: ['CLEARED', Validators.required],
    effectiveDate: [this.store.today(), Validators.required],
    description: ['']
  });

  constructor() {
    effect(() => {
      const defaultAccount = this.store.defaultAccount();

      if (defaultAccount && !this.transactionForm.controls.accountId.value) {
        this.transactionForm.controls.accountId.setValue(defaultAccount.id);
      }
    });
  }

  protected createTransaction(): void {
    if (this.transactionForm.invalid) {
      this.session.showError('Preencha conta, categoria, valor e data do lancamento.');
      return;
    }

    const payload = this.transactionForm.getRawValue();
    this.store.createTransaction({
      ...payload,
      amount: Number(payload.amount)
    });
  }

  protected money(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  }

  protected accountName(accountId: string): string {
    return this.store.accounts().find(account => account.id === accountId)?.name || 'Conta nao encontrada';
  }

  protected categoryName(categoryId?: string): string {
    if (!categoryId) {
      return 'Sem categoria';
    }

    return this.store.categories().find(category => category.id === categoryId)?.name || 'Categoria removida';
  }

  protected statusLabel(status: string): string {
    const labels: Record<string, string> = {
      CLEARED: 'Confirmado',
      PENDING: 'Pendente',
      CANCELED: 'Cancelado'
    };

    return labels[status] || status;
  }

  protected typeLabel(type: string): string {
    const labels: Record<string, string> = {
      EXPENSE: 'Despesa',
      INCOME: 'Receita',
      TRANSFER_IN: 'Transferencia recebida',
      TRANSFER_OUT: 'Transferencia enviada',
      OPENING_BALANCE: 'Saldo inicial'
    };

    return labels[type] || type;
  }
}
