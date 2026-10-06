import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Account } from '../../../../core/services/api-client';
import { FinanceStoreService } from '../../../../core/services/finance-store';
import { SessionService } from '../../../../core/services/session';

@Component({
  selector: 'app-accounts-page',
  imports: [ReactiveFormsModule],
  templateUrl: './accounts-page.html',
  styleUrl: './accounts-page.scss',
})
export class AccountsPage {
  private readonly fb = inject(FormBuilder);
  private readonly session = inject(SessionService);
  protected readonly store = inject(FinanceStoreService);
  protected editingAccountId = '';

  protected readonly accountForm = this.fb.nonNullable.group({
    name: ['Conta principal', Validators.required],
    type: ['CHECKING', Validators.required],
    currency: ['BRL', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    openingBalance: [0, Validators.min(0)]
  });

  protected readonly renameForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]]
  });

  protected createAccount(): void {
    if (this.accountForm.invalid) {
      this.session.showError('Revise os dados da conta.');
      return;
    }

    const payload = this.accountForm.getRawValue();
    this.store.createAccount({
      ...payload,
      currency: payload.currency.toUpperCase(),
      openingBalance: Number(payload.openingBalance || 0)
    });
  }

  protected loadBalance(accountId: string): void {
    this.store.loadBalance(accountId);
  }

  protected startRename(account: Account): void {
    this.editingAccountId = account.id;
    this.renameForm.reset({ name: account.name });
  }

  protected cancelRename(): void {
    this.editingAccountId = '';
    this.renameForm.reset({ name: '' });
  }

  protected renameAccount(): void {
    const name = this.renameForm.controls.name.value.trim();

    if (!name || this.renameForm.invalid) {
      this.session.showError('Informe um nome com até 100 caracteres.');
      return;
    }

    this.store.updateAccountName(this.editingAccountId, name, () => this.cancelRename());
  }
}
