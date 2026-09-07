import { Component, inject } from '@angular/core';
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
}
