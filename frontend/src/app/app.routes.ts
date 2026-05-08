import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'pago-exitoso',
    loadComponent: () => import('./pages/pago-resultado/pago-resultado.component').then(m => m.PagoResultadoComponent),
    data: { estado: 'exitoso' }
  },
  {
    path: 'pago-fallido',
    loadComponent: () => import('./pages/pago-resultado/pago-resultado.component').then(m => m.PagoResultadoComponent),
    data: { estado: 'fallido' }
  },
  {
    path: 'pago-pendiente',
    loadComponent: () => import('./pages/pago-resultado/pago-resultado.component').then(m => m.PagoResultadoComponent),
    data: { estado: 'pendiente' }
  }
];
