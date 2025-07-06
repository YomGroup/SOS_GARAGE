import { MessageComponent } from './../../message/message.component';
import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DossierManagementComponent } from './components/dossier-management/dossier-management.component';
import { GarageValidationComponent } from './components/garage-validation/garage-validation.component';
import { EpaveManagementComponent } from './components/epave-management/epave-management.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { AdministrationComponent } from './components/administration/administration.component';
import { ParametreComponent } from './components/parametre/parametre.component';
import { UserManagementComponent } from './components/administration/user-management/user-management.component';
import { AuditLogsComponent } from './components/administration/audit-logs/audit-logs.component';
import { AccessManagementComponent } from './components/administration/access-management/access-management.component';
import { AdminStatsComponent } from './components/administration/admin-stats/admin-stats.component';
import { DossierViewComponent } from './components/dossier-management/dossier-view.component';
import { GestionFinanceComponent } from './components/gestion-finance/gestion-finance.component';


const routes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'dossiers',
    component: DossierManagementComponent,
    children: [
      { path: 'view/:id', component: DossierViewComponent }
    ]
  },
  {
    path: 'dossiers/nouveaux',
    component: DossierManagementComponent
  },
  {
    path: 'dossiers/non-traites',
    component: DossierManagementComponent
  },
  {
    path: 'dossiers/termines',
    component: DossierManagementComponent
  },
  /*
  {
    path: 'garages/nouveau',
    component: AddGarageComponent
  },*/
  {
    path: 'gestion-finance',
    component: GestionFinanceComponent
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
    path: 'administration',
    component: AdministrationComponent,
    children: [
      { path: '', redirectTo: 'user-management', pathMatch: 'full' },
      { path: 'user-management', component: UserManagementComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'access-management', component: AccessManagementComponent },
      { path: 'admin-stats', component: AdminStatsComponent }
    ]
  },
  {
    path: 'parametre',
    component: ParametreComponent
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