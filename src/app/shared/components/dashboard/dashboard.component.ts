import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {UtenteResponse} from "../../models/models";
import {AuthService} from "../../../core/auth/auth.service";
import {UtenteService} from "../../../core/services/utente.service";
import {
  ModificaUtenteDialogComponent
} from "../../../features/admins/modifica-utente-dialog/modifica-utente-dialog.component";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit
{
  userProfile: UtenteResponse | null = null;
  isAdmin: boolean = false;
  recentUsers: UtenteResponse[] = [];
  loading: boolean = false;

  constructor(
    public authService: AuthService,
    private utenteService: UtenteService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.isAdmin = this.authService.isUserAdmin;
  }

  ngOnInit(): void
  {
    this.caricaProfiloUtente();
    if (this.isAdmin)
    {
      this.caricaUtentiRecenti();
    }
  }

  caricaProfiloUtente(): void
  {
    this.loading = true;
    this.authService.getCurrentUserDetails().subscribe({
      next: (profile) =>
      {
        this.userProfile = profile;
        this.loading = false;
      },
      error: (error) =>
      {
        console.error('Errore nel caricamento profilo:', error);
        this.loading = false;
      }
    });
  }

  caricaUtentiRecenti(): void
  {
    this.utenteService.ottieniTuttiGliUtenti().subscribe({
      next: (utenti) =>
      {
        this.recentUsers = utenti.slice(0, 5);
      },
      error: (error) =>
      {
        console.error('Errore nel caricamento utenti recenti:', error);
      }
    });
  }

  editMyProfile(): void
  {
    if (this.userProfile)
    {
      const dialogRef = this.dialog.open(ModificaUtenteDialogComponent,
        {
        width: '500px',
        data:
        {
          mode: 'edit',
          utente: this.userProfile
        }
      });

      dialogRef.afterClosed().subscribe(result =>
      {
        if (result)
        {
          this.caricaProfiloUtente();
        }
      });
    }
  }

  openCreateUserDialog(): void
  {
    const dialogRef = this.dialog.open(ModificaUtenteDialogComponent,
    {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result =>
    {
      if (result)
      {
        this.caricaUtentiRecenti();
      }
    });
  }
}
