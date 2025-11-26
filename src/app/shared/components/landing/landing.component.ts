import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent
{
  isAuthenticated$: Observable<boolean>;

  constructor(private authService: AuthService)
  {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }
}
