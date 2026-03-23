import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'controle',
        loadComponent: () => import('../controle/controle.page').then(m => m.ControlePage),
      },
      {
        path: 'profil',
        loadComponent: () => import('../profil/profil.page').then(m => m.ProfilPage),
      },
      {
        path: '',
        redirectTo: 'controle',
        pathMatch: 'full',
      },
    ],
  },
];
