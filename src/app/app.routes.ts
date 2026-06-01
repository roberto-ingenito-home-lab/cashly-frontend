import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { Login } from './features/login/login';
import { Signup } from './features/signup/signup';
import { ForgotPassword } from './features/forgot-password/forgot-password';
import { ResetPassword } from './features/reset-password/reset-password';
import { Dashboard } from './features/dashboard/dashboard';
import { Categories } from './features/categories/categories';
import { Transactions } from './features/transactions/transactions';
import { Layout } from './features/layout/layout';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: Login,
  },
  {
    path: 'signup',
    canActivate: [guestGuard],
    component: Signup,
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    component: ResetPassword,
  },
  {
    path: '',
    canActivate: [authGuard],
    component: Layout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
        data: { title: 'Dashboard' },
      },
      {
        path: 'categories',
        component: Categories,
        data: { title: 'Categorie' },
      },
      {
        path: 'transactions',
        component: Transactions,
        data: { title: 'Transazioni' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
