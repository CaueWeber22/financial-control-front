import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';

import { authGuard, guestGuard, routes, safeRedirectTo } from './app.routes';
import { SessionService } from './core/services/session';
import { Shell } from './layout/shell/shell';

describe('app routes', () => {
  const configure = (session: Record<string, unknown>) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SessionService, useValue: session }
      ]
    });
  };

  const runGuard = async (guardResult: ReturnType<typeof authGuard> | ReturnType<typeof guestGuard>) => {
    const result = isObservable(guardResult) ? await firstValueFrom(guardResult) : guardResult;
    return result as boolean | UrlTree;
  };

  it('redirects anonymous users to auth with the attempted URL', async () => {
    configure({
      ensureSession: () => of(false)
    });

    const result = await runGuard(TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/transactions?status=PENDING' } as RouterStateSnapshot)
    ));

    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/auth?redirectTo=%2Ftransactions%3Fstatus%3DPENDING');
  });

  it('lets authenticated users continue to protected routes', async () => {
    configure({
      ensureSession: () => of(true)
    });

    const result = await runGuard(TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/accounts' } as RouterStateSnapshot)
    ));

    expect(result).toBe(true);
  });

  it('sends authenticated guests back to a safe redirect target', async () => {
    configure({
      isAuthenticated: () => true
    });

    const snapshot = {
      queryParamMap: new Map([['redirectTo', '/summary']])
    } as unknown as ActivatedRouteSnapshot;
    const result = await runGuard(TestBed.runInInjectionContext(() =>
      guestGuard(snapshot, { url: '/auth?redirectTo=%2Fsummary' } as RouterStateSnapshot)
    ));

    expect(result instanceof UrlTree).toBe(true);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/summary');
  });

  it('keeps unknown URLs inside the guarded shell route', () => {
    const shellRoute = routes.find(route => route.component === Shell);

    expect(shellRoute?.canActivate).toContain(authGuard);
    expect(shellRoute?.children?.some(route => route.path === '**')).toBe(true);
    expect(routes.some(route => route.path === '**' && !route.canActivate)).toBe(false);
  });

  it('sanitizes redirect targets to app-local paths', () => {
    expect(safeRedirectTo('/transactions')).toBe('/transactions');
    expect(safeRedirectTo('/auth')).toBe('/');
    expect(safeRedirectTo('//evil.example')).toBe('/');
    expect(safeRedirectTo('https://evil.example')).toBe('/');
    expect(safeRedirectTo(null)).toBe('/');
  });
});
