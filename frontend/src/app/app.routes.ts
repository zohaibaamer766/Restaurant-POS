import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pos/pos.component').then(m => m.PosComponent),
    title: 'POS Terminal — QuickServe',
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history/history.component').then(m => m.HistoryComponent),
    title: 'Order History — QuickServe',
  },
  { path: '**', redirectTo: '' },
];
