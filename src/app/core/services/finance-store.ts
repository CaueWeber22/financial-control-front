import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { Account, ApiClientService, Category, SummaryRow, Transaction, Transfer } from './api-client';
import { SessionService } from './session';

@Injectable({
  providedIn: 'root'
})
export class FinanceStoreService {
  private readonly api = inject(ApiClientService);
  private readonly session = inject(SessionService);

  readonly accounts = signal<Account[]>([]);
  readonly defaultAccount = signal<Account | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly transactions = signal<Transaction[]>([]);
  readonly transfers = signal<Transfer[]>([]);
  readonly summary = signal<SummaryRow[]>([]);
  readonly summaryResult = computed(() =>
    this.summary().reduce((total, row) => total + Number(row.net || 0), 0)
  );

  loadWorkspace(): void {
    this.session.loadProfile();
    this.loadAccounts();
    this.loadDefaultAccount();
    this.loadCategories();
    this.loadTransactions();
    this.loadSummary(this.firstDayOfMonth(), this.today());
  }

  loadAccounts(): void {
    this.api.listAccounts().subscribe({
      next: accounts => this.accounts.set(accounts),
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  loadDefaultAccount(): void {
    this.api.getDefaultAccount().subscribe({
      next: account => this.defaultAccount.set(account),
      error: error => {
        if (this.isNotFound(error)) {
          this.defaultAccount.set(null);
          return;
        }

        this.session.showError(this.session.errorMessage(error));
      }
    });
  }

  createAccount(payload: Record<string, unknown>): void {
    this.api.createAccount(payload).subscribe({
      next: () => {
        this.session.showMessage('Conta criada.');
        this.loadAccounts();
        this.loadDefaultAccount();
      },
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  updateAccountName(accountId: string, name: string, onSuccess?: () => void): void {
    this.api.updateAccountName(accountId, name).subscribe({
      next: account => {
        this.accounts.update(accounts =>
          accounts.map(current => current.id === account.id ? account : current)
        );

        if (this.defaultAccount()?.id === account.id) {
          this.defaultAccount.set(account);
        }

        this.session.showMessage('Conta renomeada.');
        onSuccess?.();
      },
      error: error => this.session.showError(this.accountUpdateErrorMessage(error))
    });
  }

  archiveAccount(accountId: string, onSuccess?: () => void): void {
    const wasDefaultAccount = this.defaultAccount()?.id === accountId;

    this.api.archiveAccount(accountId).subscribe({
      next: () => {
        this.accounts.update(accounts => accounts.filter(account => account.id !== accountId));

        if (wasDefaultAccount) {
          this.loadDefaultAccount();
        }

        this.session.showMessage('Conta excluída das contas ativas.');
        onSuccess?.();
      },
      error: error => this.session.showError(this.accountArchiveErrorMessage(error))
    });
  }

  loadBalance(accountId: string): void {
    this.api.getAccountBalance(accountId).subscribe({
      next: balance =>
        this.session.showMessage(`Saldo projetado: ${balance.currency} ${Number(balance.projected).toFixed(2)}`),
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  loadCategories(): void {
    this.api.listCategories().subscribe({
      next: categories => this.categories.set(categories),
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  createCategory(payload: Record<string, unknown>): void {
    this.api.createCategory(payload).subscribe({
      next: () => {
        this.session.showMessage('Categoria criada.');
        this.loadCategories();
      },
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  loadTransactions(): void {
    this.api.listTransactions().subscribe({
      next: page => this.transactions.set(page.content || []),
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  createTransaction(payload: Record<string, unknown>): void {
    this.api.createTransaction(payload).subscribe({
      next: () => {
        this.session.showMessage('Lancamento criado.');
        this.loadTransactions();
        this.loadSummary(this.firstDayOfMonth(), this.today());
      },
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  createTransfer(payload: Record<string, unknown>): void {
    this.api.createTransfer(payload).subscribe({
      next: transfer => {
        this.transfers.update(items => [transfer, ...items]);
        this.session.showMessage('Transferencia criada.');
        this.loadAccounts();
      },
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  loadSummary(from: string, to: string): void {
    this.api.getSummary(from, to).subscribe({
      next: summary => this.summary.set(summary),
      error: error => this.session.showError(this.session.errorMessage(error))
    });
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  firstDayOfMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }

  private accountUpdateErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'Já existe uma conta ativa com esse nome.';
      }

      if (error.status === 404) {
        return 'Conta não encontrada.';
      }
    }

    return this.session.errorMessage(error);
  }

  private accountArchiveErrorMessage(error: unknown): string {
    if (this.isNotFound(error)) {
      return 'Conta não encontrada.';
    }

    return this.session.errorMessage(error);
  }
}
