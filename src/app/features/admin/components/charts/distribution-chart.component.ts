import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-distribution-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <canvas baseChart
      [data]="pieChartData"
      [options]="pieChartOptions"
      [type]="'pie'">
    </canvas>
  `
})
export class DistributionChartComponent {
  pieChartData = {
    labels: ['Garages', 'Dossiers', 'Épaves', 'Documents'],
    datasets: [{
      data: [156, 89, 45, 234],
      backgroundColor: ['#004aad', '#aa38cb', '#ff6b6b', '#4ecdc4']
    }]
  };

  pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };
} 