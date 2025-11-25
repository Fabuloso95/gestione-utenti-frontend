import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Ruolo } from '../../shared/models/models';
import {AuthService} from "../auth/auth.service";


export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRoles: Ruolo[] = route.data['roles'];

  if (!expectedRoles || expectedRoles.length === 0)
  {
    return true;
  }

  const userHasRequiredRole = authService.hasRole(expectedRoles);

  if (userHasRequiredRole)
  {
    console.log('Accesso permesso: Ruolo autorizzato.');
    return true;
  }
  else
  {
    console.warn('Accesso negato: Ruolo non sufficiente per la risorsa.');

    return router.createUrlTree(['/home'],
    {
      queryParams: { accessDenied: true }
    });
  }
};
