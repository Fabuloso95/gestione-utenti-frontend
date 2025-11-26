import { Component, OnDestroy } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription, throwError } from 'rxjs';
import { finalize, catchError } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RegistrazioneRequest, ErrorResponse } from '../../../shared/models/models';

export const confirmedPasswordValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (!password || !confirmPassword || password.value === null || confirmPassword.value === null) {
    return null;
  }

  if (password.value !== confirmPassword.value)
  {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  else
  {
    if (confirmPassword.hasError('mismatch'))
    {
      confirmPassword.setErrors(null);
    }
  }

  return null;
};

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  providers: [AuthService],
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
})
export class RegisterComponent implements OnDestroy
{
  isLoading: boolean = false;
  errorMessage: string | null = null;
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  private registerSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router
  )
  {}

  registerForm = new FormGroup({
    nome: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    cognome: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    codiceFiscale: new FormControl<string>('',
    {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i)]
    }),
    dataNascita: new FormControl<string>('',
    {
      nonNullable: true,
      validators: [Validators.required, this.dateOfBirthValidator]
    }),
    password: new FormControl<string>('',
    {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)]
    }),
    confirmPassword: new FormControl<string>('',
    {
      nonNullable: true,
      validators: [Validators.required]
    }),
  }, { validators: confirmedPasswordValidator });

  dateOfBirthValidator(control: AbstractControl): ValidationErrors | null
  {
    if (!control.value)
    {
      return null;
    }

    const dateOfBirth = new Date(control.value);
    const now = new Date();
    const minAgeDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());

    return dateOfBirth < minAgeDate ? null : { minAge: true };
  }

  get f()
  {
    return this.registerForm.controls;
  }

  isFieldInvalid(controlName: string): boolean
  {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.errorMessage = 'Per favore, correggi gli errori evidenziati nel form.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const { nome, cognome, codiceFiscale, dataNascita, password } = this.registerForm.getRawValue();

    const date = new Date(dataNascita);
    const dataNascitaFormatted = date.toISOString().split('T')[0];

    const request: RegistrazioneRequest =
    {
      nome,
      cognome,
      codiceFiscale,
      dataNascita: dataNascitaFormatted,
      password
    };

    this.registerSubscription = this.authService.register(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
        catchError((error: HttpErrorResponse) =>
        {
          const errorBody: ErrorResponse = error?.error;

          if (error.status === 409)
          {
            this.errorMessage = errorBody?.message || 'Utente già registrato. Prova con un altro Codice Fiscale.';
          }
          else
          {
            this.errorMessage = errorBody?.message || 'Errore di registrazione sconosciuto. Riprova.';
          }
          console.error('Errore di registrazione API:', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (_) =>
        {
          console.log('Registrazione completata con successo. Effettuo login automatico...');

          const loginRequest =
          {
            codiceFiscale: codiceFiscale,
            password: password
          };

          this.authService.login(loginRequest).subscribe({
            next: () =>
            {
              console.log('Login automatico completato. Navigazione alla Dashboard.');
              this.router.navigate(['/dashboard']);
            },
            error: (loginError) =>
            {
              console.error('Login automatico fallito:', loginError);
              this.router.navigate(['/login'], {
                queryParams: { registered: true }
              });
            }
          });
        },
        error: () =>
        {
        }
      });
  }

  ngOnDestroy(): void
  {
    if (this.registerSubscription)
    {
      this.registerSubscription.unsubscribe();
    }
  }
}
