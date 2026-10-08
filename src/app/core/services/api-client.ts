import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SKIP_AUTH_REFRESH } from '../interceptors/auth-token.interceptor';
import { CookieAuthService } from './cookie-auth';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT';
  currency: string;
  status: 'ACTIVE' | 'ARCHIVED';
  defaultAccount: boolean;
}

export interface AccountBalance {
  accountId: string;
  currency: string;
  cleared: number;
  pending: number;
  projected: number;
}

export interface Category {
  id: string;
  name: string;
  kind: 'INCOME' | 'EXPENSE';
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId?: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'OPENING_BALANCE';
  amount: number;
  status: 'PENDING' | 'CLEARED' | 'CANCELED';
  effectiveDate: string;
  description?: string;
}

export interface Transfer {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  status: 'PENDING' | 'CLEARED' | 'CANCELED';
  effectiveDate: string;
  description?: string;
  cancelReason?: string;
  canceledAt?: string;
}

export interface SummaryRow {
  currency: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProblemDetails {
  title?: string;
  detail?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly cookieAuth = inject(CookieAuthService);
  private readonly baseUrl = environment.apiBaseUrl;

  register(payload: Record<string, unknown>): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.baseUrl}/users`, payload);
  }

  login(email: string, password: string): Observable<void> {
    return this.cookieAuth.login(email, password);
  }

  refresh(): Observable<void> {
    return this.cookieAuth.refresh();
  }

  logout(): Observable<void> {
    return this.cookieAuth.logout();
  }

  getMe(options: { skipAuthRefresh?: boolean } = {}): Observable<UserProfile> {
    const context = options.skipAuthRefresh
      ? new HttpContext().set(SKIP_AUTH_REFRESH, true)
      : undefined;

    return this.http.get<UserProfile>(`${this.baseUrl}/users/me`, {
      context,
      timeout: 30000
    });
  }

  listAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.baseUrl}/accounts`, {
      params: new HttpParams().set('status', 'ACTIVE')
    });
  }

  getDefaultAccount(): Observable<Account> {
    return this.http.get<Account>(`${this.baseUrl}/accounts/default`);
  }

  createAccount(payload: Record<string, unknown>): Observable<Account> {
    return this.http.post<Account>(`${this.baseUrl}/accounts`, payload);
  }

  updateAccountName(accountId: string, name: string): Observable<Account> {
    return this.http.patch<Account>(`${this.baseUrl}/accounts/${accountId}`, { name });
  }

  archiveAccount(accountId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${accountId}`);
  }

  getAccountBalance(accountId: string): Observable<AccountBalance> {
    return this.http.get<AccountBalance>(`${this.baseUrl}/accounts/${accountId}/balance`);
  }

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`, {
      params: new HttpParams().set('status', 'ACTIVE')
    });
  }

  createCategory(payload: Record<string, unknown>): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, payload);
  }

  listTransactions(): Observable<PageResponse<Transaction>> {
    return this.http.get<PageResponse<Transaction>>(`${this.baseUrl}/transactions`, {
      params: new HttpParams().set('page', 0).set('size', 8)
    });
  }

  createTransaction(payload: Record<string, unknown>, idempotencyKey = this.idempotencyKey()): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.baseUrl}/transactions`, payload, {
      headers: this.idempotencyHeaders(idempotencyKey)
    });
  }

  createTransfer(payload: Record<string, unknown>, idempotencyKey = this.idempotencyKey()): Observable<Transfer> {
    return this.http.post<Transfer>(`${this.baseUrl}/transfers`, payload, {
      headers: this.idempotencyHeaders(idempotencyKey)
    });
  }

  cancelTransfer(transferId: string, reason: string): Observable<Transfer> {
    return this.http.post<Transfer>(`${this.baseUrl}/transfers/${transferId}/cancel`, { reason });
  }

  getSummary(from: string, to: string): Observable<SummaryRow[]> {
    return this.http.get<SummaryRow[]>(`${this.baseUrl}/summary`, {
      params: new HttpParams().set('from', from).set('to', to)
    });
  }

  health(): Observable<{ status: string }> {
    return this.http.get<{ status: string }>(environment.healthUrl, {
      params: new HttpParams().set('_', Date.now())
    });
  }

  private idempotencyHeaders(value: string): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': value });
  }

  private idempotencyKey(): string {
    if ('randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
