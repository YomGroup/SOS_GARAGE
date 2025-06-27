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
import { RouterModule } from '@angular/router';
import { PerformanceChartComponent } from '../charts/performance-chart.component';
import { DistributionChartComponent } from '../charts/distribution-chart.component';
import { EvolutionChartComponent } from '../charts/evolution-chart.component';
import { AdminService } from '../../../../../services/admin.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
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
    RecentActivityComponent,
    RouterModule,
    PerformanceChartComponent,
    DistributionChartComponent,
    EvolutionChartComponent,
    HttpClientModule
  ],
  standalone: true,
  providers: [AdminService]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 0;
  currentGraph: 'performance' | 'distribution' | 'evolution' = 'performance';
  
  stats = {
    totalVehicules: 0,
    totalSinistres: 0,
    enCours: 0,
    epavesEnAttente: 0
  };

  recentVehicules: any[] = [];
  recentSinistres: any[] = [];

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadVehicules();
  }

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

  private loadVehicules(): void {
    this.adminService.getAllVehicules().subscribe({
      next: (vehicules) => {
        this.stats.totalVehicules = vehicules.length;
        this.recentVehicules = vehicules.slice(0, 3); // Prend les 3 premiers pour l'affichage
      },
      error: (error) => {
        console.error('Erreur lors du chargement des véhicules:', error);
      }
    });
  }

  onTabChange(event: { index: number }): void {
    this.activeTab = event.index;
  }

  showGraph(type: 'performance' | 'distribution' | 'evolution'): void {
    this.currentGraph = type;
  }
}