import { Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { FinanceStoreService } from '../../../../core/services/finance-store';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-transfers-page',
  imports: [ReactiveFormsModule],
  templateUrl: './transfers-page.html',
  styleUrl: './transfers-page.scss',
})
export class TransfersPage {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  protected readonly store = inject(FinanceStoreService);

  protected readonly transferForm = this.fb.nonNullable.group({
    sourceAccountId: ['', Validators.required],
    destinationAccountId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    effectiveDate: [this.store.today(), Validators.required],
    description: ['']
  });

  constructor() {
    effect(() => {
      const defaultAccount = this.store.defaultAccount();

      if (defaultAccount && !this.transferForm.controls.sourceAccountId.value) {
        this.transferForm.controls.sourceAccountId.setValue(defaultAccount.id);
      }
    });
  }

  protected createTransfer(): void {
    if (this.transferForm.invalid) {
      this.session.showError('Preencha origem, destino, valor e data da transferencia.');
      return;
    }

    const payload = this.transferForm.getRawValue();
    this.store.createTransfer({
      ...payload,
      amount: Number(payload.amount)
    });
  }
}
