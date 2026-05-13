import { Spaces } from './pages/backend/spaces/spaces';
import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { BackendLayout } from './shared/backend-layout/backend-layout';
import { authGuard } from './guards/auth-guard';
import { Dashboard } from './pages/backend/dashboard/dashboard';
import { Bookings } from './pages/backend/bookings/bookings';
import { Fix } from './pages/backend/fix/fix';
import { Members } from './pages/backend/members/members';
import { Profile } from './pages/backend/profile/profile';


export const routes: Routes = [
  {path: 'login', component: Login},
  {
    path: 'backend',
    component: BackendLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard, data: { title: '儀表板總覽' } },
      { path: 'spaces',    component: Spaces,    data: { title: '空間與資產' } },
      { path: 'bookings',  component: Bookings,  data: { title: '預訂與日曆' } },
      { path: 'fix',       component: Fix,       data: { title: '維修'       } },
      { path: 'members',   component: Members,   data: { title: '成員與公司' } },
      { path: 'profile',   component: Profile,   data: { title: '個人資料'   } }
    ]
  }
];
