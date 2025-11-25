import {ChangeDetectionStrategy, Component, OnDestroy} from '@angular/core';
import {AuthService} from "../auth.service";
import {Router, RouterModule} from "@angular/router";
import {MatCardModule} from "@angular/material/card";
import {MatInputModule} from "@angular/material/input";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {Subscription} from "rxjs";
import {ErrorResponse, LoginRequest} from "../../../shared/models/models";
import {finalize} from "rxjs/operators";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [AuthService],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnDestroy
{
  isLoading: boolean = false;
  errorMessage: string | null = null;
  hidePassword: boolean = true;
  private loginSubscription: Subscription | undefined;

  loginForm = new FormGroup({
    codiceFiscale: new FormControl<string>('',
    {
      nonNullable: true,
      validators: [Validators.required]
    }),
    password: new FormControl<string>('',
    {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)]
    }),
  });

  constructor(
    private authService: AuthService,
    private router: Router
  )
  {
    this.router = { navigate: (path: string[]) => console.log('NAVIGAZIONE VERSO:', path[0]) } as any;
  }

  get f()
  {
    return this.loginForm.controls;
  }

  isFieldInvalid(field: keyof LoginRequest): boolean
  {
    const control = this.f[field];
    return control.invalid && (control.dirty || control.touched);
  }

  onSubmit(): void
  {
    if (this.loginForm.invalid)
    {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const credentials: LoginRequest = this.loginForm.getRawValue();

    if (this.loginSubscription)
    {
      this.loginSubscription.unsubscribe();
    }

    this.loginSubscription = this.authService.login(credentials)
      .pipe(
        finalize(() =>
        {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () =>
        {
          (this.router as any).navigate(['/']);
        },
        error: (error: any) =>
        {
          const errorBody: ErrorResponse = error?.error;

          if (error.status === 401)
          {
            this.errorMessage = errorBody?.message || 'Credenziali non valide. Riprova.';
          }
          else
          {
            this.errorMessage = errorBody?.message || 'Errore sconosciuto. Riprova più tardi.';
          }
          console.error('Errore di login dettagliato:', error);
        }
      });
  }

  ngOnDestroy(): void
  {
    if (this.loginSubscription)
    {
      this.loginSubscription.unsubscribe();
    }
  }
}
