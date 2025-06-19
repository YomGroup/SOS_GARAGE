import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-performance-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  template: `
    <canvas baseChart
      [data]="lineChartData"
      [options]="lineChartOptions"
      [type]="'line'">
    </canvas>
  `
})
export class PerformanceChartComponent implements OnInit {
  lineChartData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Performance',
      data: [65, 59, 80, 81, 56, 55],
      fill: true,
      borderColor: '#004aad',
      backgroundColor: 'rgba(0, 74, 173, 0.1)',
      tension: 0.4
    }]
  };

  lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  constructor() { }

  ngOnInit(): void { }
} 