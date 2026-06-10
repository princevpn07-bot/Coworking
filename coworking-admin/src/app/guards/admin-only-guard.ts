import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const adminOrStaffGuard: CanActivateFn = () =>
{
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isPartner()) {
    router.navigate(['/backend/dashboard']);
    return false;
  }
  return true;
};
