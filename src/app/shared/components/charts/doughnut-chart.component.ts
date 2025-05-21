import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { NgChartsModule } from 'ng2-charts';

@Component({
  selector: 'app-doughnut-chart',
  standalone: true,
  imports: [
    CommonModule,
    NgChartsModule
  ],
  template: `
    <div style="height: 240px;">
      <canvas baseChart
        [data]="doughnutChartData"
        [options]="doughnutChartOptions"
        [type]="doughnutChartType">
      </canvas>
    </div>
    <div class="grid grid-cols-2 gap-2 mt-3">
      <div *ngFor="let item of legendItems; let i = index" class="flex items-center">
        <div [style.background-color]="item.color" class="h-3 w-3 rounded-full mr-2"></div>
        <div class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</div>
      </div>
    </div>
  `
})
export class DoughnutChartComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  legendItems = [
    { label: 'Open', color: 'rgba(249, 115, 22, 0.8)' },
    { label: 'In Progress', color: 'rgba(99, 102, 241, 0.8)' },
    { label: 'Resolved', color: 'rgba(16, 185, 129, 0.8)' },
    { label: 'Closed', color: 'rgba(107, 114, 128, 0.8)' }
  ];

  public doughnutChartData: ChartConfiguration['data'] = {
    datasets: [
      {
        data: [30, 45, 20, 15],
        backgroundColor: [
          'rgba(249, 115, 22, 0.8)', // accent orange
          'rgba(99, 102, 241, 0.8)', // primary indigo
          'rgba(16, 185, 129, 0.8)', // success green
          'rgba(107, 114, 128, 0.8)'  // gray
        ],
        hoverOffset: 5,
      }
    ],
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    animation: {
      duration: 1000
    }
  };

  public doughnutChartType: ChartType = 'doughnut';

  constructor() {}

  ngOnInit(): void {}
}