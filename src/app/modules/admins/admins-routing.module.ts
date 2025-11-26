import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import {ListaUtentiComponent} from "../../features/admins/lista-utenti/lista-utenti.component";

const routes: Routes = [
  {
    path: 'utenti',
    component: ListaUtentiComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminsRoutingModule { }
