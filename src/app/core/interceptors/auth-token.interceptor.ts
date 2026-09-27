import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('cointrol.accessToken');

  const isApiRequest = request.url === environment.apiBaseUrl ||
    request.url.startsWith(`${environment.apiBaseUrl}/`) ||
    request.url.startsWith(`${environment.apiBaseUrl}?`);

  if (!token || !isApiRequest) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
