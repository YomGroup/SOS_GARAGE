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
    RoleManagementComponent
  ]
})
export class AdminModule { } 