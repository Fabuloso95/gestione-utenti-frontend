import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {UtenteResponse} from "../../../shared/models/models";
import {UtenteService} from "../../../core/services/utente.service";
import {AuthService} from "../../../core/auth/auth.service";
import {ModificaUtenteDialogComponent} from "../modifica-utente-dialog/modifica-utente-dialog.component";
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-lista-utenti',
  templateUrl: './lista-utenti.component.html',
  styleUrls: ['./lista-utenti.component.css']
})
export class ListaUtentiComponent implements OnInit, OnDestroy
{
  utenti: UtenteResponse[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  isAdmin: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private utenteService: UtenteService,
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.isAdmin = this.authService.isUserAdmin;
  }

  ngOnInit(): void
  {
    this.caricaUtenti();
  }

  ngOnDestroy(): void
  {
    this.subscriptions.unsubscribe();
  }

  caricaUtenti(): void
  {
    this.loading = true;
    const sub = this.utenteService.ottieniTuttiGliUtenti().subscribe({
      next: (utenti) =>
      {
        this.utenti = utenti;
        this.loading = false;
      },
      error: (error) =>
      {
        console.error('Errore nel caricamento utenti:', error);
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  onSearch(): void
  {
    if (this.searchTerm.trim())
    {
      this.loading = true;
      const sub = this.utenteService.cercaUtenti(this.searchTerm).subscribe({
        next: (utenti) =>
        {
          this.utenti = utenti;
          this.loading = false;
        },
        error: (error) =>
        {
          console.error('Errore nella ricerca:', error);
          this.loading = false;
        }
      });
      this.subscriptions.add(sub);
    }
    else
    {
      this.caricaUtenti();
    }
  }

  clearSearch(): void
  {
    this.searchTerm = '';
    this.caricaUtenti();
  }

  viewDetails(id: number): void
  {
    this.router.navigate(['/utenti', id]);
  }

  openCreateDialog(): void
  {
    const dialogRef = this.dialog.open(ModificaUtenteDialogComponent,
      {
        width: '500px',
        data: { mode: 'create' }
      });

    const sub = dialogRef.afterClosed().subscribe(result =>
    {
      if (result)
      {
        this.caricaUtenti();
      }
    });
    this.subscriptions.add(sub);
  }

  openEditDialog(utente: UtenteResponse): void
  {
    const dialogRef = this.dialog.open(ModificaUtenteDialogComponent,
      {
        width: '500px',
        data: { mode: 'edit', utente: utente }
      });

    const sub = dialogRef.afterClosed().subscribe(result =>
    {
      if (result)
      {
        this.caricaUtenti();
      }
    });
    this.subscriptions.add(sub);
  }

  deleteUtente(id: number, utenteNome?: string, utenteCognome?: string): void
  {
    const utenteToDelete = this.utenti.find(u => u.id === id);
    const nomeCompleto = utenteToDelete ? `${utenteToDelete.nome} ${utenteToDelete.cognome}` : 'questo utente';

    const dialogData: ConfirmationDialogData = {
      title: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare l'utente ${nomeCompleto}? Questa operazione non è reversibile.`,
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      icon: 'delete_forever',
      color: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
      autoFocus: false
    });

    const sub = dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.eseguiEliminazione(id);
      }
    });
    this.subscriptions.add(sub);
  }

  private eseguiEliminazione(id: number): void
  {
    const sub = this.utenteService.eliminaUtente(id).subscribe({
      next: () =>
      {
        this.caricaUtenti();
      },
      error: (error) =>
      {
        console.error('Errore nell\'eliminazione:', error);
      }
    });
    this.subscriptions.add(sub);
  }
}
