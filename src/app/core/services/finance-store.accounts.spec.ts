import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Account } from './api-client';
import { FinanceStoreService } from './finance-store';
import { SessionService } from './session';

describe('FinanceStoreService account actions', () => {
  let store: FinanceStoreService;
  let http: HttpTestingController;
  let session: {
    showMessage: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
    errorMessage: ReturnType<typeof vi.fn>;
  };

  const checkingAccount: Account = {
    id: 'checking-account',
    name: 'Conta principal',
    type: 'CHECKING',
    currency: 'BRL',
    status: 'ACTIVE',
    defaultAccount: true
  };

  const savingsAccount: Account = {
    id: 'savings-account',
    name: 'Reserva',
    type: 'SAVINGS',
    currency: 'BRL',
    status: 'ACTIVE',
    defaultAccount: false
  };

  beforeEach(() => {
    session = {
      showMessage: vi.fn(),
      showError: vi.fn(),
      errorMessage: vi.fn(() => 'Erro inesperado')
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: session }
      ]
    });

    store = TestBed.inject(FinanceStoreService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('archives an active default account and refreshes the default account state', () => {
    const onSuccess = vi.fn();
    store.accounts.set([checkingAccount, savingsAccount]);
    store.defaultAccount.set(checkingAccount);

    store.archiveAccount(checkingAccount.id, onSuccess);

    const archiveRequest = http.expectOne(`${environment.apiBaseUrl}/accounts/${checkingAccount.id}`);
    expect(archiveRequest.request.method).toBe('DELETE');
    archiveRequest.flush(null, { status: 204, statusText: 'No Content' });

    const defaultRequest = http.expectOne(`${environment.apiBaseUrl}/accounts/default`);
    expect(defaultRequest.request.method).toBe('GET');
    defaultRequest.flush({ ...savingsAccount, defaultAccount: true });

    expect(store.accounts()).toEqual([savingsAccount]);
    expect(store.defaultAccount()).toEqual({ ...savingsAccount, defaultAccount: true });
    expect(session.showMessage).toHaveBeenCalledWith('Conta excluída das contas ativas.');
    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('shows a friendly message when archiving an unknown account', () => {
    store.accounts.set([checkingAccount]);

    store.archiveAccount('missing-account');

    const archiveRequest = http.expectOne(`${environment.apiBaseUrl}/accounts/missing-account`);
    expect(archiveRequest.request.method).toBe('DELETE');
    archiveRequest.flush({}, { status: 404, statusText: 'Not Found' });

    expect(store.accounts()).toEqual([checkingAccount]);
    expect(session.showError).toHaveBeenCalledWith('Conta não encontrada.');
    expect(session.showMessage).not.toHaveBeenCalled();
  });
});
