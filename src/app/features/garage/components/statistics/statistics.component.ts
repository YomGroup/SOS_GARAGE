import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface MissionStats {
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

interface FinancialStats {
  totalInvoices: number;
  totalCommissions: number;
  netBalance: number;
}

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
    total: 150,
    completed: 98,
    inProgress: 35,
    pending: 17
  };

  financialStats: FinancialStats = {
    totalInvoices: 45000,
    totalCommissions: 4500,
    netBalance: 40500
  };

  recentMissions = [
    {
      id: 'M001',
      date: new Date(),
      status: 'completed',
      amount: 1200
    },
    {
      id: 'M002',
      date: new Date(),
      status: 'in_progress',
      amount: 850
    },
    {
      id: 'M003',
      date: new Date(),
      status: 'pending',
      amount: 1500
    }
  ];

  constructor() {}

  ngOnInit(): void {}
} 