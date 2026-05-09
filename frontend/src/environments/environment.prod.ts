/**
 * Production environment (Vercel build).
 *
 * Frontend is hosted on https://www.fletea.com.ar (Vercel)
 * Backend is hosted on https://api.fletea.com.ar (VPS)
 *
 * The two are different origins, so we use absolute URLs and rely
 * on the backend's CORS configuration to allow www.fletea.com.ar.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.fletea.com.ar/api',
};
