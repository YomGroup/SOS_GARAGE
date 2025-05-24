import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-4">
      <div *ngFor="let activity of activities" class="flex items-start space-x-3">
        <mat-icon [class]="activity.iconClass">{{activity.icon}}</mat-icon>
        <div>
          <p class="text-sm font-medium">{{activity.title}}</p>
          <p class="text-xs text-gray-500">{{activity.time}}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class RecentActivityComponent {
  activities = [
    {
      icon: 'build',
      iconClass: 'text-blue-500',
      title: 'Nouvelle réparation démarrée',
      time: 'Il y a 5 minutes'
    },
    {
      icon: 'check_circle',
      iconClass: 'text-green-500',
      title: 'Dossier #1234 terminé',
      time: 'Il y a 1 heure'
    },
    {
      icon: 'warning',
      iconClass: 'text-yellow-500',
      title: 'Garage en attente de validation',
      time: 'Il y a 2 heures'
    },
    {
      icon: 'car_crash',
      iconClass: 'text-red-500',
      title: 'Nouvelle épave enregistrée',
      time: 'Il y a 3 heures'
    }
  ];
} 