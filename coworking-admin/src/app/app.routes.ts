import { Spaces } from './pages/backend/spaces/spaces';
import { Routes } from '@angular/router';
import { Login } from './pages/auth/login/login';
import { BackendLayout } from './shared/backend-layout/backend-layout';
import { FrontendLayout } from './shared/frontend-layout/frontend-layout';
import { authGuard } from './guards/auth-guard';
import { Dashboard } from './pages/backend/dashboard/dashboard';
import { Bookings } from './pages/backend/bookings/bookings';
import { Resources } from './pages/backend/resources/resources';
import { Members } from './pages/backend/members/members';
import { Profile } from './pages/backend/profile/profile';
import { Home } from './pages/frontend/home/home';
import { AllSpaces } from './pages/frontend/all-spaces/all-spaces';
import { SpaceDetail } from './pages/frontend/space-detail/space-detail';
import { Register } from './pages/auth/register/register';
import { MyOrders } from './pages/frontend/my-orders/my-orders';
import { PaymentComponent } from './pages/frontend/payment-component/payment-component';

export const routes: Routes = [
  {
    path: '',
    component: FrontendLayout,
    children: [
      { path: '', component: Home },
      { path: 'all-spaces', component: AllSpaces },
      { path: 'space/:id', component: SpaceDetail },
      { path: 'my-orders', component: MyOrders },
      { path: 'payment', component: PaymentComponent }
    ]
  },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: 'backend',
    component: BackendLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard, data: { title: '儀表板總覽' } },
      { path: 'spaces',    component: Spaces,    data: { title: '空間與資產' } },
      { path: 'bookings',  component: Bookings,  data: { title: '預訂與日曆' } },
      { path: 'resources', component: Resources,  data: { title: '資源調配'   } },
      { path: 'members',   component: Members,   data: { title: '成員與公司' } },
      { path: 'profile',   component: Profile,   data: { title: '個人資料'   } }
    ]
  }
];
