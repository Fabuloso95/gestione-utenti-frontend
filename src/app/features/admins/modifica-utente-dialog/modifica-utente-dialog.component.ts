import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {Ruolo, UtenteRequest, UtenteResponse, UtenteUpdateRequest} from "../../../shared/models/models";
import {UtenteService} from "../../../core/services/utente.service";
import {AuthService} from "../../../core/auth/auth.service";

interface DialogData
{
  mode: 'create' | 'edit';
  utente?: UtenteResponse;
}

@Component({
  selector: 'app-modifica-utente-dialog',
  templateUrl: './modifica-utente-dialog.component.html',
  styleUrls: ['./modifica-utente-dialog.component.css']
})
export class ModificaUtenteDialogComponent implements OnInit
{
  utenteForm: FormGroup;
  loading: boolean = false;
  isAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private utenteService: UtenteService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<ModificaUtenteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.utenteForm = this.createForm();
    this.isAdmin = this.authService.isUserAdmin;
  }

  ngOnInit(): void
  {
    if (this.data.mode === 'edit' && this.data.utente)
    {
      this.populateForm(this.data.utente);
    }
  }

  createForm(): FormGroup
  {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      cognome: ['', [Validators.required, Validators.minLength(2)]],
      codiceFiscale: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(16)]],
      dataNascita: ['', Validators.required],
      password: ['', this.data.mode === 'create' ? [Validators.required, Validators.minLength(6)] : []],
      ruolo: ['USER', this.data.mode === 'create' ? Validators.required : []]
    });
  }

  populateForm(utente: UtenteResponse): void
  {
    this.utenteForm.patchValue({
      nome: utente.nome,
      cognome: utente.cognome,
      codiceFiscale: utente.codiceFiscale,
      dataNascita: utente.dataNascita,
      ruolo: utente.ruolo
    });

    this.utenteForm.get('password')?.clearValidators();
    this.utenteForm.get('password')?.updateValueAndValidity();

    if (this.data.mode === 'edit')
    {
      this.utenteForm.get('codiceFiscale')?.disable();
    }
  }

  isFieldInvalid(fieldName: string): boolean
  {
    const field = this.utenteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void
  {
    if (this.utenteForm.valid)
    {
      this.loading = true;

      if (this.data.mode === 'create')
      {
        this.createUtente();
      }
      else
      {
        this.updateUtente();
      }
    }
    else
    {
      Object.keys(this.utenteForm.controls).forEach(key =>
      {
        this.utenteForm.get(key)?.markAsTouched();
      });
    }
  }

  createUtente(): void
  {
    const utenteData: UtenteRequest =
    {
      nome: this.utenteForm.value.nome,
      cognome: this.utenteForm.value.cognome,
      codiceFiscale: this.utenteForm.value.codiceFiscale,
      dataNascita: this.utenteForm.value.dataNascita,
      password: this.utenteForm.value.password,
      ruolo: this.utenteForm.value.ruolo as Ruolo
    };

    this.utenteService.creaUtente(utenteData).subscribe({
      next: () =>
      {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (error) =>
      {
        console.error('Errore nella creazione:', error);
        this.loading = false;
      }
    });
  }

  updateUtente(): void
  {
    if (!this.data.utente) return;

    const utenteData: UtenteUpdateRequest =
    {
      nome: this.utenteForm.value.nome,
      cognome: this.utenteForm.value.cognome,
      dataNascita: this.utenteForm.value.dataNascita,
      ruolo: this.utenteForm.value.ruolo as Ruolo
    };

    this.utenteService.aggiornaUtente(this.data.utente.id, utenteData).subscribe({
      next: () =>
      {
        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (error) =>
      {
        console.error('Errore nell\'aggiornamento:', error);
        this.loading = false;
      }
    });
  }

  onCancel(): void
  {
    this.dialogRef.close(false);
  }
}
