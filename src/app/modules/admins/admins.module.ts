import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {ListaUtentiComponent} from "../../features/admins/lista-utenti/lista-utenti.component";
import {
  ModificaUtenteDialogComponent
} from "../../features/admins/modifica-utente-dialog/modifica-utente-dialog.component";
import {AdminsRoutingModule} from "./admins-routing.module";

@NgModule({
  declarations: [
    ListaUtentiComponent,
    ModificaUtenteDialogComponent
  ],
  imports: [
    CommonModule,
    AdminsRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTableModule
  ]
})
export class AdminsModule { }
