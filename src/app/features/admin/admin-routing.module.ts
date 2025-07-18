import { MessageComponent } from './../../message/message.component';
import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DossierManagementComponent } from './components/dossier-management/dossier-management.component';
import { GarageValidationComponent } from './components/garage-validation/garage-validation.component';
import { EpaveManagementComponent } from './components/epave-management/epave-management.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';


const routes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'dossiers',
    component: DossierManagementComponent
  },
  {
    path: 'garages',
    component: GarageValidationComponent
  },
  {
    path: 'epaves',
    component: EpaveManagementComponent
  },
  {
    path: 'roles',
    component: RoleManagementComponent
  },
  {
    path: 'messages',
    component: MessageComponent
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { } 