import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UtenteResponse } from '../../models/models';
import { AuthService } from '../../../core/auth/auth.service';
import { UtenteService } from '../../../core/services/utente.service';
import { ModificaUtenteDialogComponent } from '../../../features/admins/modifica-utente-dialog/modifica-utente-dialog.component';

@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.component.html',
  styleUrls: ['./profilo.component.css']
})
export class ProfiloComponent implements OnInit {
  userProfile: UtenteResponse | null = null;
  loading: boolean = false;

  constructor(
    public authService: AuthService,
    private utenteService: UtenteService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.caricaProfiloUtente();
  }

  caricaProfiloUtente(): void {
    this.loading = true;
    this.authService.getCurrentUserDetails().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore nel caricamento profilo:', error);
        this.loading = false;
      }
    });
  }

  modificaProfilo(): void {
    if (this.userProfile) {
      const dialogRef = this.dialog.open(ModificaUtenteDialogComponent, {
        width: '500px',
        data: {
          mode: 'edit',
          utente: this.userProfile,
          isOwnProfile: true
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.caricaProfiloUtente();
        }
      });
    }
  }

  tornaAllaDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
