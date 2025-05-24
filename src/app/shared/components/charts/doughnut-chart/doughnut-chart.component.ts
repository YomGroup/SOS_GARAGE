import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  imports: [CommonModule],
  template: '<canvas id="doughnutChart"></canvas>',
  styles: [`
    :host {
      display: block;
      height: 300px;
    }
  `]
})
export class DoughnutChartComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeChart();
    }
  }

  private initializeChart() {
    const ctx = document.getElementById('doughnutChart') as HTMLCanvasElement;
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['En cours', 'Terminés', 'En attente', 'Annulés'],
          datasets: [{
            data: [300, 50, 100, 20],
            backgroundColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 205, 86)',
              'rgb(201, 203, 207)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  }
} 