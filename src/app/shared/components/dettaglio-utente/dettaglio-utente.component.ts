import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import {UtenteResponse} from "../../models/models";
import {UtenteService} from "../../../core/services/utente.service";
import {AuthService} from "../../../core/auth/auth.service";
import {
  ModificaUtenteDialogComponent
} from "../../../features/admins/modifica-utente-dialog/modifica-utente-dialog.component";
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData
} from "../confirmation-dialog/confirmation-dialog.component";

@Component({
  selector: 'app-dettaglio-utente',
  templateUrl: './dettaglio-utente.component.html',
  styleUrls: ['./dettaglio-utente.component.css']
})
export class DettaglioUtenteComponent implements OnInit, OnDestroy
{
  @Input() utenteId?: number;
  @Input() mostraPulsanteIndietro: boolean = true;

  utente: UtenteResponse | null = null;
  loading: boolean = false;
  error: string = '';
  isAdmin: boolean = false;
  currentUserId: number | null = null;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private utenteService: UtenteService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private dialog: MatDialog
  ) {
    this.isAdmin = this.authService.isUserAdmin;
  }

  ngOnInit(): void
  {
    if (!this.utenteId)
    {
      const id = this.route.snapshot.paramMap.get('id');
      if (id)
      {
        this.utenteId = +id;
      }
    }

    this.caricaDettagli();
    this.caricaUtenteCorrente();
  }

  ngOnDestroy(): void
  {
    this.subscriptions.unsubscribe();
  }

  caricaDettagli(): void
  {
    if (!this.utenteId)
    {
      this.error = 'ID utente non specificato';
      return;
    }

    this.loading = true;
    this.error = '';

    const sub = this.utenteService.ottieniUtente(this.utenteId).subscribe({
      next: (utente) =>
      {
        this.utente = utente;
        this.loading = false;
      },
      error: (error) =>
      {
        console.error('Errore nel caricamento dettagli:', error);
        this.error = 'Impossibile caricare i dati dell\'utente';
        this.loading = false;
      }
    });

    this.subscriptions.add(sub);
  }

  caricaUtenteCorrente(): void
  {
    const sub = this.authService.getCurrentUserDetails().subscribe({
      next: (user) =>
      {
        this.currentUserId = user.id;
      },
      error: (error) =>
      {
        console.error('Errore nel caricamento utente corrente:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  puoModificare(): boolean
  {
    if (!this.utente || !this.currentUserId) return false;

    return this.isAdmin || this.utente.id === this.currentUserId;
  }

  modificaUtente(): void
  {
    if (!this.utente) return;

    const dialogRef = this.dialog.open(ModificaUtenteDialogComponent,
      {
        width: '500px',
        data:
          {
            mode: 'edit',
            utente: this.utente
          }
      });

    const sub = dialogRef.afterClosed().subscribe(result =>
    {
      if (result)
      {
        this.caricaDettagli();
      }
    });

    this.subscriptions.add(sub);
  }

  eliminaUtente(): void
  {
    if (!this.utente || !this.isAdmin) return;

    const dialogData: ConfirmationDialogData =
    {
      title: 'Conferma Eliminazione Utente',
      message: `Sei sicuro di voler eliminare definitivamente l'utente ${this.utente.nome} ${this.utente.cognome}? Questa azione non è reversibile.`,
      confirmText: 'Sì, Elimina',
      cancelText: 'Annulla',
      icon: 'delete_forever',
      color: 'warn'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent,
    {
      width: '400px',
      data: dialogData,
      autoFocus: false
    });

    const sub = dialogRef.afterClosed().subscribe((result: boolean) =>
    {
      if (result)
      {
        this.eseguiEliminazione();
      }
    });

    this.subscriptions.add(sub);
  }

  private eseguiEliminazione(): void
  {
    if (!this.utente) return;

    const sub = this.utenteService.eliminaUtente(this.utente.id).subscribe({
      next: () =>
      {
        this.router.navigate(['/utenti']);
      },
      error: (error) =>
      {
        console.error('Errore nell\'eliminazione:', error);
        this.error = 'Impossibile eliminare l\'utente';
      }
    });

    this.subscriptions.add(sub);
  }

  tornaIndietro(): void
  {
    if (this.mostraPulsanteIndietro)
    {
      this.location.back();
    }
  }
}
