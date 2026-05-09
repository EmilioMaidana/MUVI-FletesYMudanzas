/**
 * Development environment.
 *
 * In dev (`npm start`), the Angular CLI proxies `/api/*` to the local
 * Spring backend at http://localhost:8080 — see proxy.conf.json.
 * So a relative `/api` base URL works during development.
 */
export const environment = {
  production: false,
  apiBaseUrl: '/api',
};
