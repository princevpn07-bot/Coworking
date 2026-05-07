import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { Role } from '../models/role.model';

export const authGuard: CanActivateFn = (route, state) =>
{
  const authservice = inject(AuthService);
  const router = inject(Router);
  const token = authservice.gettoken();
  const role = authservice.getrole();

  if (!token || (role !== Role.Admin && role !== Role.Staff))
    {
      router.navigate(['/login'])
      return false;
    }
   return true
};
