import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  template: `
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-2">
        <li>
          <div class="flex items-center">
            <a
              routerLink="/"
              class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Accueil
            </a>
          </div>
        </li>
        <li *ngFor="let item of breadcrumbs; let last = last">
          <div class="flex items-center">
            <mat-icon class="text-gray-400">chevron_right</mat-icon>
            <a
              *ngIf="!last"
              [routerLink]="item.route"
              class="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              {{ item.label }}
            </a>
            <span
              *ngIf="last"
              class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ item.label }}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  `
})
export class BreadcrumbsComponent {
  breadcrumbs = [
    { label: 'Véhicules', route: '/vehicles' },
    { label: 'Détails', route: '/vehicles/123' }
  ];
} 