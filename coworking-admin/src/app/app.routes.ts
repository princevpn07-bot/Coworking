import { Spaces } from './pages/backend/spaces/spaces';
import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { BackendLayout } from './shared/backend-layout/backend-layout';
import { authGuard } from './guards/auth-guard';


export const routes: Routes = [
  {path: 'login', component: Login},
  {
    path: 'backend',
    component: BackendLayout,
    canActivate: [authGuard],
    children:[ {path: 'spaces', component: Spaces}]
  }
];
