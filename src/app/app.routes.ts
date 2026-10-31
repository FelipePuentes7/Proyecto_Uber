import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.page').then((m) => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register/register.page').then((m) => m.RegisterPage)
  },
  {
    path: 'client',
    canActivate: [roleGuard(['client'])],
    loadComponent: () =>
      import('./pages/client/client-home.page').then((m) => m.ClientHomePage)
  },
  {
    path: 'driver',
    canActivate: [roleGuard(['driver'])],
    loadComponent: () =>
      import('./pages/driver/driver-home.page').then((m) => m.DriverHomePage)
  },
  {
    path: 'admin',
    canActivate: [roleGuard(['admin'])],
    loadComponent: () =>
      import('./pages/admin/admin-dashboard.page').then((m) => m.AdminDashboardPage)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

