import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';

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
  imports: [CommonModule, DatePipe, CurrencyPipe],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-2xl font-bold mb-6">Statistiques et Historique</h2>

      <!-- Statistiques des missions -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Statut des missions</h3>
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Total</p>
            <p class="text-2xl font-bold">{{ missionStats.total }}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Terminées</p>
            <p class="text-2xl font-bold">{{ missionStats.completed }}</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">En cours</p>
            <p class="text-2xl font-bold">{{ missionStats.inProgress }}</p>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">En attente</p>
            <p class="text-2xl font-bold">{{ missionStats.pending }}</p>
          </div>
        </div>
      </div>

      <!-- Tableau de bord financier -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4">Tableau de bord financier</h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Total des factures</p>
            <p class="text-2xl font-bold">{{ financialStats.totalInvoices | currency:'EUR' }}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Commissions</p>
            <p class="text-2xl font-bold">{{ financialStats.totalCommissions | currency:'EUR' }}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600">Solde net</p>
            <p class="text-2xl font-bold">{{ financialStats.netBalance | currency:'EUR' }}</p>
          </div>
        </div>
      </div>

      <!-- Historique des missions -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Historique des missions</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Mission
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let mission of recentMissions">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ mission.id }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ mission.date | date:'short' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': mission.status === 'completed',
                    'bg-yellow-100 text-yellow-800': mission.status === 'in_progress',
                    'bg-red-100 text-red-800': mission.status === 'pending'
                  }">
                    {{ mission.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ mission.amount | currency:'EUR' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
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