import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DossierManagementComponent } from '../dossier-management/dossier-management.component';
import { GarageValidationComponent } from '../garage-validation/garage-validation.component';
import { EpaveManagementComponent } from '../epave-management/epave-management.component';
import { RoleManagementComponent } from '../role-management/role-management.component';
import { LineChartComponent, BarChartComponent, DoughnutChartComponent } from '../../../../shared/components/charts';
import { RecentActivityComponent } from '../../../../shared/components/recent-activity/recent-activity.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatButtonToggleModule,
    DossierManagementComponent,
    GarageValidationComponent,
    EpaveManagementComponent,
    RoleManagementComponent,
    LineChartComponent,
    BarChartComponent,
    DoughnutChartComponent,
    RecentActivityComponent
  ],
  standalone: true
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 0;
  stats = {
    totalDossiers: 0,
    dossiersEnCours: 0,
    garagesEnAttente: 0,
    epavesEnAttente: 0
  };

  constructor() { }

  ngOnInit(): void {
    // TODO: Charger les statistiques depuis le backend
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
  }
} 