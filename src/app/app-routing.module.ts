import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './shared/components/landing/landing.component';
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { DettaglioUtenteComponent } from './shared/components/dettaglio-utente/dettaglio-utente.component';
import { authGuard } from './core/guards/auth.guard';
import {ProfiloComponent} from "./shared/components/profilo/profilo.component";

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'home', component: LandingComponent },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profilo',
    component: ProfiloComponent,
    canActivate: [authGuard],
    data: { mostraPulsanteIndietro: false }
  },
  {
    path: 'utenti/:id',
    component: DettaglioUtenteComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admins/admins.module').then(m => m.AdminsModule),
    canActivate: [authGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./modules/users/users.module').then(m => m.UsersModule),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
