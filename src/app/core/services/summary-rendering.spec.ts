import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { DashboardPage } from '../../features/dashboard/pages/dashboard-page/dashboard-page';
import { SummaryPage } from '../../features/summaries/pages/summary-page/summary-page';
import { FinanceStoreService } from './finance-store';
import { SessionService } from './session';

describe('Summary API rendering', () => {
  let store: FinanceStoreService;
  let http: HttpTestingController;
  const money = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage, SummaryPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SessionService, useValue: { loadProfile: vi.fn() } }
      ]
    }).compileComponents();
    store = TestBed.inject(FinanceStoreService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushSummary(response: { currency: string; income: number; expenses: number; net: number }[]): void {
    const request = http.expectOne(req => req.url === `${environment.apiBaseUrl}/summary`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('from')).toBe(store.firstDayOfMonth());
    expect(request.request.params.get('to')).toBe(store.today());
    request.flush(response);
  }

  it.each([
    { income: 0, expenses: 150, net: -150 },
    { income: 1000, expenses: 150, net: 850 },
    { income: 150, expenses: 150, net: 0 }
  ])('renders net $net on the home after loading the workspace', row => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    store.loadWorkspace();
    http.expectOne(`${environment.apiBaseUrl}/accounts?status=ACTIVE`).flush([]);
    http.expectOne(`${environment.apiBaseUrl}/categories?status=ACTIVE`).flush([]);
    http.expectOne(`${environment.apiBaseUrl}/transactions?page=0&size=8`).flush({ content: [] });
    flushSummary([{ currency: 'BRL', ...row }]);
    fixture.detectChanges();

    expect(store.summaryResult()).toBe(row.net);
    expect(fixture.nativeElement.querySelector('.statement-result strong').textContent)
      .toBe(money(row.net));
  });

  it('renders expenses and net from the API in the report', () => {
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    flushSummary([{ currency: 'BRL', income: 0, expenses: 150, net: -150 }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.currency-result > strong').textContent)
      .toBe(money(-150));
    const amounts = fixture.nativeElement.querySelectorAll('.currency-result dd');
    expect(amounts[0].textContent).toBe(money(0));
    expect(amounts[1].textContent).toBe(money(150));
  });

  it('renders zero on the home and an empty report when the API has no summary', () => {
    const home = TestBed.createComponent(DashboardPage);
    const report = TestBed.createComponent(SummaryPage);
    store.loadSummary(store.firstDayOfMonth(), store.today());
    flushSummary([]);
    home.detectChanges();
    report.detectChanges();

    expect(home.nativeElement.querySelector('.statement-result strong').textContent).toBe(money(0));
    expect(report.nativeElement.querySelector('.report-results .empty-state').textContent)
      .toContain('Sem movimentações no período selecionado.');
  });
});
