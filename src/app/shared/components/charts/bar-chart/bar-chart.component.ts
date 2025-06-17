import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: '<canvas id="barChart"></canvas>',
  styles: [`
    :host {
      display: block;
      height: 300px;
    }
  `]
})
export class BarChartComponent implements OnInit {
  ngOnInit() {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Réparations',
          data: [12, 19, 3, 5, 2, 3, 7],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
} 