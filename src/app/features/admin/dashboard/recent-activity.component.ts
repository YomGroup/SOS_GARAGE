import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Activity {
  id: number;
  type: 'case' | 'garage' | 'wreck' | 'user';
  title: string;
  description: string;
  user: string;
  time: Date;
}

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule
  ],
  template: `
    <div class="space-y-4">
      <div *ngFor="let activity of activities" class="flex">
        <div class="flex-shrink-0">
          <div [ngClass]="getIconClass(activity.type)" class="h-8 w-8 rounded-full flex items-center justify-center text-white">
            <mat-icon class="text-sm">{{ getIcon(activity.type) }}</mat-icon>
          </div>
        </div>
        <div class="ml-3 w-0 flex-1">
          <div class="text-sm text-gray-900 dark:text-white font-medium">
            {{ activity.title }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ activity.description }}
          </div>
          <div class="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{{ activity.user }}</span>
            <span class="mx-1">•</span>
            <span>{{ activity.time | date:'short' }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RecentActivityComponent implements OnInit {
  activities: Activity[] = [
    {
      id: 1,
      type: 'case',
      title: 'Case #12345 updated',
      description: 'Status changed from "In Progress" to "Resolved"',
      user: 'Sarah Johnson',
      time: new Date(Date.now() - 1000 * 60 * 25) // 25 minutes ago
    },
    {
      id: 2,
      type: 'garage',
      title: 'New garage registered',
      description: 'AutoFix Garage applied for partnership',
      user: 'System',
      time: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      id: 3,
      type: 'wreck',
      title: 'Wreck evaluation completed',
      description: 'Wreck #4532 approved for salvage auction',
      user: 'Mike Peters',
      time: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
    },
    {
      id: 4,
      type: 'user',
      title: 'New user added',
      description: 'Jennifer Lewis joined as Claims Manager',
      user: 'Admin',
      time: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
    }
  ];

  getIcon(type: string): string {
    switch(type) {
      case 'case': return 'description';
      case 'garage': return 'garage';
      case 'wreck': return 'car_crash';
      case 'user': return 'person';
      default: return 'info';
    }
  }

  getIconClass(type: string): string {
    switch(type) {
      case 'case': return 'bg-primary-500';
      case 'garage': return 'bg-secondary-500';
      case 'wreck': return 'bg-warning-500';
      case 'user': return 'bg-success-500';
      default: return 'bg-gray-500';
    }
  }

  constructor() {}

  ngOnInit(): void {}
}