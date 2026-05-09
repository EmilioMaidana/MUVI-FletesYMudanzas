import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Attaches the JWT to admin-only requests.
 *
 * The check matches `/api/reservas` regardless of whether the URL is relative
 * (dev: `/api/reservas`) or absolute (prod: `https://api.fletea.com.ar/api/reservas`),
 * because `String.prototype.includes` works on both forms.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  if (token && req.url.includes('/api/reservas')) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  return next(req);
};
