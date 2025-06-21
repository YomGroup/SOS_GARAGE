import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-evolution-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <canvas baseChart
      [data]="barChartData"
      [options]="barChartOptions"
      [type]="'bar'">
    </canvas>
  `
})
export class EvolutionChartComponent {
  barChartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Évolution',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: '#004aad'
    }]
  };

  barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };
}