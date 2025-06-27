import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DossierManagementComponent } from './components/dossier-management/dossier-management.component';
import { GarageValidationComponent } from './components/garage-validation/garage-validation.component';
import { EpaveManagementComponent } from './components/epave-management/epave-management.component';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { AddGarageComponent } from './components/garage-validation/add-garage/add-garage.component';
import { AdministrationComponent } from './components/administration/administration.component';
import { ParametreComponent } from './components/parametre/parametre.component';
import { UserManagementComponent } from './components/administration/user-management/user-management.component';
import { AuditLogsComponent } from './components/administration/audit-logs/audit-logs.component';
import { AccessManagementComponent } from './components/administration/access-management/access-management.component';
import { AdminStatsComponent } from './components/administration/admin-stats/admin-stats.component';
import { PreferencesManagementComponent } from './components/parametre/preferences-management/preferences-management.component';
import { NotificationManagementComponent } from './components/parametre/notification-management/notification-management.component';
import { SecurityManagementComponent } from './components/parametre/security-management/security-management.component';
import { CustomizationManagementComponent } from './components/parametre/customization-management/customization-management.component';
import { DossierEditComponent } from './components/dossier-management/dossier-edit/dossier-edit.component';

const routes: Routes = [
  {
    path: 'dashboard',
    component: AdminDashboardComponent
  },
  {
    path: 'dossiers',
    component: DossierManagementComponent,
    children: [
      { path: 'edit/:id', component: DossierEditComponent }
    ]
  },
  {
    path: 'dossiers/edit/:id',
    component: DossierEditComponent
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
    component: ParametreComponent,
    children: [
      { path: '', redirectTo: 'preferences-management', pathMatch: 'full' },
      { path: 'preferences-management', component: PreferencesManagementComponent },
      { path: 'notification-management', component: NotificationManagementComponent },
      { path: 'security-management', component: SecurityManagementComponent },
      { path: 'customization-management', component: CustomizationManagementComponent }
    ]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    AdminDashboardComponent,
    DossierManagementComponent,
    GarageValidationComponent,
    EpaveManagementComponent,
    RoleManagementComponent,
    AddGarageComponent,
    ParametreComponent,
    UserManagementComponent,
    AuditLogsComponent,
    AccessManagementComponent,
    AdminStatsComponent
  ]
})
export class AdminModule { } 