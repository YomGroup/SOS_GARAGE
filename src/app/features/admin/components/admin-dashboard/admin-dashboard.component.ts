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
  
  // Données temporaires pour le développement
  stats = {
    totalVehicules: 1243,
    totalSinistres: 567,
    enCours: 89,
    epavesEnAttente: 32
  };

  constructor() { }

  ngOnInit(): void {
    // TODO: À implémenter quand le backend sera disponible
    // this.loadStats();
  }

  // Méthode à implémenter plus tard avec le backend
  /*
  private loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    });
  }
  */

  onTabChange(event: { index: number }): void {
    this.activeTab = event.index;
  }
} 