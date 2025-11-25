import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { map, take } from 'rxjs/operators';
import {AuthService} from "../auth/auth.service";

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
{
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuth =>
    {
      if (isAuth)
      {
        return true;
      }
      else
      {
        console.log('Non autenticato, reindirizzo al login.');
        return router.createUrlTree(['/login']);
      }
    })
  );
};
