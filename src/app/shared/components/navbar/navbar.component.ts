import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent
{
  isAuthenticated$: Observable<boolean>;

  constructor(
    protected authService: AuthService,
    private router: Router
  ) {

    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  logout(): void
  {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
