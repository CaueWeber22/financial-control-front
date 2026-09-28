import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CookieAuthService, isCsrfError } from '../services/cookie-auth';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url === environment.apiBaseUrl ||
    request.url.startsWith(`${environment.apiBaseUrl}/`) ||
    request.url.startsWith(`${environment.apiBaseUrl}?`);

  if (!isApiRequest) {
    return next(request);
  }

  const auth = inject(CookieAuthService);
  const url = request.url.split('?')[0];
  const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  const publicRequest = url.startsWith(`${environment.apiBaseUrl}/auth/`) ||
    (request.method === 'POST' && url === `${environment.apiBaseUrl}/users`);
  const credentialedRequest = request.clone({
    withCredentials: true,
    headers: request.headers.delete('Authorization')
  });

  const send = (csrfRetried = false, authRetried = false): Observable<HttpEvent<unknown>> =>
    auth.waitForRefresh().pipe(
      switchMap(() => mutation ? auth.csrf() : of(null)),
      switchMap(csrf => next(csrf ? credentialedRequest.clone({
        setHeaders: { [csrf.headerName]: csrf.token }
      }) : credentialedRequest).pipe(
        catchError(error => {
          if (mutation && !csrfRetried && isCsrfError(error)) {
            auth.invalidateCsrf();
            return send(true, authRetried);
          }
          if (!publicRequest && error instanceof HttpErrorResponse && error.status === 401) {
            if (!authRetried) {
              return auth.refresh().pipe(switchMap(() => send(csrfRetried, true)));
            }
            auth.expire();
          }
          return throwError(() => error);
        })
      ))
    );

  return send();
};
