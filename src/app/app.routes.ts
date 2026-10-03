import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { map } from 'rxjs';

import { SessionService } from './core/services/session';
import { AccountsPage } from './features/accounts/pages/accounts-page/accounts-page';
import { AuthPage } from './features/auth/pages/auth-page/auth-page';
import { CategoriesPage } from './features/categories/pages/categories-page/categories-page';
import { DashboardPage } from './features/dashboard/pages/dashboard-page/dashboard-page';
import { SummaryPage } from './features/summaries/pages/summary-page/summary-page';
import { TransactionsPage } from './features/transactions/pages/transactions-page/transactions-page';
import { TransfersPage } from './features/transfers/pages/transfers-page/transfers-page';
import { Shell } from './layout/shell/shell';

export function safeRedirectTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/auth')) {
    return '/';
  }

  return value;
}

export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  return session.ensureSession().pipe(
    map(authenticated => authenticated || router.createUrlTree(['/auth'], {
      queryParams: { redirectTo: safeRedirectTo(state.url) }
    }))
  );
};

export const guestGuard: CanActivateFn = (route) => {
  const session = inject(SessionService);
  const router = inject(Router);

  return !session.isAuthenticated() || router.parseUrl(safeRedirectTo(route.queryParamMap.get('redirectTo')));
};

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthPage,
    canActivate: [guestGuard]
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: DashboardPage
      },
      {
        path: 'accounts',
        component: AccountsPage
      },
      {
        path: 'categories',
        component: CategoriesPage
      },
      {
        path: 'transactions',
        component: TransactionsPage
      },
      {
        path: 'transfers',
        component: TransfersPage
      },
      {
        path: 'summary',
        component: SummaryPage
      },
      {
        path: '**',
        redirectTo: ''
      }
    ]
  }
];
