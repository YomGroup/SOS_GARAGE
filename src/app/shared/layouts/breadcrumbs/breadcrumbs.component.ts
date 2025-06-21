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
    <nav class="flex w-full py-2 px-4" aria-label="Fil d'Ariane">
      <ol class="flex flex-wrap items-center gap-2">
        <li>
          <div class="flex items-center">
            <a
              routerLink="/"
              class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 
                     transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 rounded-md px-2 py-1"
            >
              Accueil
            </a>
          </div>
        </li>
        <li *ngFor="let item of breadcrumbs; let last = last">
          <div class="flex items-center">
            <mat-icon class="text-gray-400 w-4 h-4" aria-hidden="true">chevron_right</mat-icon>
            <a
              *ngIf="!last"
              [routerLink]="item.route"
              class="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 
                     transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 rounded-md px-2 py-1"
              [attr.aria-current]="last ? 'page' : null"
            >
              {{ item.label }}
            </a>
            <span
              *ngIf="last"
              class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 px-2 py-1"
              aria-current="page"
            >
              {{ item.label }}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      background-color: var(--surface-ground);
    }
    
    @media (max-width: 640px) {
      nav {
        padding: 0.5rem;
      }
      
      .text-sm {
        font-size: 0.875rem;
      }
    }
  `]
})
export class BreadcrumbsComponent {
  breadcrumbs = [
    { label: 'Véhicules', route: '/vehicles' },
    { label: 'Détails', route: '/vehicles/123' }
  ];
} 