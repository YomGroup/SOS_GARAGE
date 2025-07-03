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
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { PerformanceChartComponent } from '../charts/performance-chart.component';
import { DistributionChartComponent } from '../charts/distribution-chart.component';
import { EvolutionChartComponent } from '../charts/evolution-chart.component';
import { AdminService } from '../../../../../services/admin.service';
import { HttpClientModule } from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { MissionService } from '../../../../../services/mission.service';
import { ReparateurService } from '../../../../../services/reparateur.service';

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
  providers: [AdminService, MissionService, ReparateurService]
})
export class AdminDashboardComponent implements OnInit {
  activeTab = 0;
  currentGraph: 'performance' | 'distribution' | 'evolution' = 'performance';
  
  stats = {
    totalVehicules: 0,
    totalSinistres: 0,
    totalMissions: 0,
    totalReparateurs: 0
  };

  recentVehicules: any[] = [];
  recentSinistres: any[] = [];
  recentMissions: any[] = [];
  recentReparateurs: any[] = [];
  recentActivity: any[] = [];
  pendingMissionsCount = 0;
  pendingReparateursCount = 0;
  pendingSinistresCount = 0;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private missionService: MissionService,
    private reparateurService: ReparateurService
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.loadData();
      }
    });
  }

  private loadData(): void {
    this.adminService.getAllVehicules().subscribe({
      next: (vehicules) => {
        this.stats.totalVehicules = vehicules.length;
        this.recentVehicules = vehicules.slice(0, 3);
        this.updateRecentActivity('vehicule', vehicules);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des véhicules:', error);
      }
    });
    this.adminService.getSinistre().subscribe({
      next: (sinistres) => {
        this.stats.totalSinistres = sinistres.length;
        this.recentSinistres = sinistres.slice(0, 3);
        this.pendingSinistresCount = sinistres.filter(s => s.isvalid === false).length;
        this.updateRecentActivity('sinistre', sinistres);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des sinistres:', error);
      }
    });
    this.missionService.getAllMissions().subscribe({
      next: (missions) => {
        this.stats.totalMissions = missions.length;
        this.recentMissions = missions.slice(0, 3);
        this.pendingMissionsCount = missions.filter(m => m.statut && m.statut.toLowerCase().includes('attente')).length;
        this.updateRecentActivity('mission', missions);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des missions:', error);
      }
    });
    this.reparateurService.getAllReparateurs().subscribe({
      next: (reparateurs) => {
        this.stats.totalReparateurs = reparateurs.length;
        this.recentReparateurs = reparateurs.slice(0, 3);
        this.pendingReparateursCount = reparateurs.filter(r => (r.isvalids + '').toLowerCase() === 'false').length;
        this.updateRecentActivity('reparateur', reparateurs);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réparateurs:', error);
      }
    });
  }

  private updateRecentActivity(type: string, items: any[]): void {
    const mapped = (items || []).map(item => {
      let date = item.createdAt || item.dateCreation || item.updatedAt || null;
      return {
        type,
        date: date ? new Date(date) : new Date(),
        label: this.getActivityLabel(type, item),
        icon: this.getActivityIcon(type)
      };
    });
    this.recentActivity = [...(this.recentActivity || []), ...mapped];
    this.recentActivity = this.recentActivity
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  }

  private getActivityLabel(type: string, item: any): string {
    switch (type) {
      case 'vehicule':
        return `Nouveau véhicule : ${item.marque || item.modele || 'Véhicule'}`;
      case 'sinistre':
        return `Nouveau sinistre : ${item.type || 'Sinistre'}`;
      case 'mission':
        return `Nouvelle mission : ${item.statut || 'Mission'}`;
      case 'reparateur':
        return `Nouveau réparateur : ${item.nomDuGarage || item.name || 'Réparateur'}`;
      default:
        return 'Nouvelle activité';
    }
  }

  private getActivityIcon(type: string): string {
    switch (type) {
      case 'vehicule':
        return 'fas fa-car text-primary';
      case 'sinistre':
        return 'fas fa-file-alt text-danger';
      case 'mission':
        return 'fas fa-tasks text-info';
      case 'reparateur':
        return 'fas fa-user-cog text-warning';
      default:
        return 'fas fa-bell';
    }
  }

  onTabChange(event: { index: number }): void {
    this.activeTab = event.index;
  }

  showGraph(type: 'performance' | 'distribution' | 'evolution'): void {
    this.currentGraph = type;
  }
}