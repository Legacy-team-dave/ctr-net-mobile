import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'enrollement',
        loadComponent: () => import('../enrollement/enrollement.page').then(m => m.EnrollementPage),
      },
      {
        path: 'profil',
        loadComponent: () => import('../profil/profil.page').then(m => m.ProfilPage),
      },
      {
        path: '',
        redirectTo: 'enrollement',
        pathMatch: 'full',
      },
    ],
  },
];
