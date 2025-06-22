import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardGaragisteService, FinancialStats, MissionStats, RecentMission } from '../../../../services/dashboard-garagiste.service';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {
  missionStats: MissionStats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  };

  financialStats: FinancialStats = {
    totalInvoices: 0,
    totalCommissions: 0,
    netBalance: 0
  };

  recentMissions: RecentMission[] = [];

  constructor(private dashboardService: DashboardGaragisteService) {}

  ngOnInit(): void {
    this.dashboardService.getDashboardData().subscribe(data => {
      if (data) {
        this.missionStats = data.missionStats;
        this.financialStats = data.financialStats;
        this.recentMissions = data.recentMissions;
      }
    });
  }
} 