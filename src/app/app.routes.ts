import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage),
  },
  {
    path: 'config',
    loadComponent: () => import('./pages/config/config.page').then(m => m.ConfigPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [noAuthGuard],
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then(m => m.routes),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
];
