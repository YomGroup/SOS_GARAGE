import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  template: `
    <div class="card hover:shadow-card-hover transition-all duration-300">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div [ngClass]="iconClass" class="w-12 h-12 rounded-lg flex items-center justify-center text-white">
            <mat-icon>{{ icon }}</mat-icon>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {{ title }}
            </dt>
            <dd>
              <div class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ value | number }}
              </div>
            </dd>
          </dl>
        </div>
      </div>
      <div class="mt-4 flex items-center" *ngIf="change !== undefined">
        <mat-icon *ngIf="trend === 'up'" class="text-success-500 mr-1 text-sm">arrow_upward</mat-icon>
        <mat-icon *ngIf="trend === 'down'" class="text-danger-500 mr-1 text-sm">arrow_downward</mat-icon>
        <span [ngClass]="{
          'text-success-500': trend === 'up',
          'text-danger-500': trend === 'down'
        }" class="text-sm font-medium">
          {{ change | number: '1.1-1' }}%
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400 ml-2">from last month</span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: number = 0;
  @Input() change?: number;
  @Input() icon: string = 'trending_up';
  @Input() iconClass: string = 'bg-primary-500';
  @Input() trend: 'up' | 'down' | 'neutral' = 'neutral';
}