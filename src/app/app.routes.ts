import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'painel-parceiros',
    loadComponent: () => import('./features/painel-parceiros/painel-parceiros.component').then(m => m.PainelParceirosComponent)
  },
  {
    path: 'parceiros',
    loadComponent: () => import('./features/parceiros/parceiros.component').then(m => m.ParceirosComponent)
  },
  {
    path: 'fechamentos',
    loadComponent: () => import('./features/fechamentos/fechamentos.component').then(m => m.FechamentosComponent)
  },
  {
    path: 'relatorio-repasse',
    loadComponent: () => import('./features/relatorio-repasse/relatorio-repasse.component').then(m => m.RelatorioRepasseComponent)
  },
  {
    path: 'notas-fiscais',
    loadComponent: () => import('./features/notas-fiscais/notas-fiscais.component').then(m => m.NotasFiscaisComponent)
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./features/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
