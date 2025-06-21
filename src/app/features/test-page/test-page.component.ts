import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProjectMember {
  id: string;
  avatar: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  updatedAt: string;
  members: ProjectMember[];
  status: 'In Progress' | 'Pending Review' | 'Overdue' | 'In Review' | 'Completed' | 'Scheduled';
  tasks: {
    completed: number;
    total: number;
    isNew?: boolean;
  };
  progress: number;
  files: number;
  comments: number;
  dueDate: string;
}

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white min-h-screen">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="relative">
              <input 
                type="text" 
                placeholder="Search project name..."
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Filter By:</span>
              <select class="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Status</option>
              </select>
              <select class="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Deadline</option>
              </select>
              <select class="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>8</option>
              </select>
            </div>
            
            <div class="flex border border-gray-300 rounded">
              <button class="p-2 hover:bg-gray-50">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z"></path>
                </svg>
              </button>
              <button class="p-2 bg-blue-600 text-white">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <!-- Table Header -->
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div class="flex items-center space-x-1">
                  <span>PROJECT</span>
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                  </svg>
                </div>
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MEMBERS</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div class="flex items-center space-x-1">
                  <span>STATUS</span>
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                  </svg>
                </div>
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TASKS</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROGRESS</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ATTACHMENTS</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COMMENTS</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div class="flex items-center space-x-1">
                  <span>DUE DATE</span>
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"></path>
                  </svg>
                </div>
              </th>
              <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let project of projects" class="hover:bg-gray-50">
              <!-- Project Column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div [class]="project.iconBg + ' rounded p-2 mr-3'">
                    <span class="text-lg">{{ project.icon }}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ project.name }}</div>
                    <div class="text-xs text-gray-500">{{ project.updatedAt }}</div>
                  </div>
                </div>
              </td>

              <!-- Members Column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex -space-x-2">
                  <img 
                    *ngFor="let member of project.members; let i = index" 
                    [src]="member.avatar" 
                    [alt]="member.name"
                    class="w-8 h-8 rounded-full border-2 border-white"
                    [class.z-10]="i === 0"
                    [class.z-20]="i === 1"
                    [class.z-30]="i === 2"
                  >
                </div>
              </td>

              <!-- Status Column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span [ngClass]="getStatusClass(project.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ project.status }}
                </span>
              </td>

              <!-- Tasks Column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-900">{{ project.tasks.completed }}/{{ project.tasks.total }}</span>
                  <span *ngIf="project.tasks.isNew" class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">+{{ project.tasks.total - project.tasks.completed }} New</span>
                </div>
              </td>

              <!-- Progress Column -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    [ngClass]="getProgressBarClass(project.status)"
                    class="h-2 rounded-full transition-all duration-300" 
                    [style.width.%]="project.progress">
                  </div>
                </div>
              </td>

              <!-- Attachments Column -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ project.files }} Files
              </td>

              <!-- Comments Column -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ project.comments }} Comment{{ project.comments !== 1 ? 's' : '' }}
              </td>

              <!-- Due Date Column -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ project.dueDate }}
              </td>

              <!-- Actions Column -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex space-x-2">
                  <button class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                  <button class="text-gray-400 hover:text-gray-600">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"></path>
                    </svg>
                  </button>
                  <button class="text-gray-400 hover:text-red-600">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          Showing 1 to 8 of 10 projects
        </div>
        <div class="flex items-center space-x-2">
          <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">‹</button>
          <button class="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
          <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">2</button>
          <button class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">›</button>
        </div>
      </div>
    </div>
  `
})
export class ProjectDashboardComponent {
  projects: Project[] = [
    {
      id: '1',
      name: 'AI Analytics Dashboard',
      icon: '{}',
      iconBg: 'bg-green-100',
      updatedAt: 'Updated 5 minutes ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' },
        { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Mike Johnson' },
        { id: '4', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Sarah Wilson' }
      ],
      status: 'In Progress',
      tasks: { completed: 18, total: 60, isNew: true },
      progress: 85,
      files: 15,
      comments: 5,
      dueDate: '10 May, 2025'
    },
    {
      id: '2',
      name: 'E-commerce Platform',
      icon: '🖥️',
      iconBg: 'bg-blue-100',
      updatedAt: 'Updated 12 minutes ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' },
        { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Mike Johnson' }
      ],
      status: 'Pending Review',
      tasks: { completed: 10, total: 40 },
      progress: 60,
      files: 8,
      comments: 3,
      dueDate: '12 May, 2025'
    },
    {
      id: '3',
      name: 'UI Kit Design',
      icon: '🎨',
      iconBg: 'bg-purple-100',
      updatedAt: 'Updated 30 minutes ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' }
      ],
      status: 'Overdue',
      tasks: { completed: 20, total: 40 },
      progress: 50,
      files: 12,
      comments: 7,
      dueDate: '5 May, 2025'
    },
    {
      id: '4',
      name: 'Website Redesign',
      icon: '🌐',
      iconBg: 'bg-yellow-100',
      updatedAt: 'Updated 1 hour ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' },
        { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Mike Johnson' }
      ],
      status: 'In Review',
      tasks: { completed: 15, total: 30, isNew: true },
      progress: 75,
      files: 6,
      comments: 2,
      dueDate: '18 May, 2025'
    },
    {
      id: '5',
      name: 'Marketing Report',
      icon: '📊',
      iconBg: 'bg-red-100',
      updatedAt: 'Updated 2 hours ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' },
        { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Mike Johnson' },
        { id: '4', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Sarah Wilson' }
      ],
      status: 'Completed',
      tasks: { completed: 40, total: 40 },
      progress: 100,
      files: 20,
      comments: 10,
      dueDate: '1 May, 2025'
    },
    {
      id: '6',
      name: 'Sales Pitch Deck',
      icon: '💼',
      iconBg: 'bg-indigo-100',
      updatedAt: 'Updated 45 minutes ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' }
      ],
      status: 'In Review',
      tasks: { completed: 9, total: 12, isNew: true },
      progress: 70,
      files: 5,
      comments: 1,
      dueDate: '9 May, 2025'
    },
    {
      id: '7',
      name: 'Mobile UI Mockups',
      icon: '📱',
      iconBg: 'bg-teal-100',
      updatedAt: 'Updated yesterday',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' },
        { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Mike Johnson' },
        { id: '4', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Sarah Wilson' }
      ],
      status: 'In Progress',
      tasks: { completed: 6, total: 10, isNew: true },
      progress: 60,
      files: 7,
      comments: 0,
      dueDate: '6 May, 2025'
    },
    {
      id: '8',
      name: 'Server Maintenance',
      icon: '🖥️',
      iconBg: 'bg-gray-100',
      updatedAt: 'Updated 3 days ago',
      members: [
        { id: '1', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'John Doe' },
        { id: '2', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Jane Smith' },
        { id: '3', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Mike Johnson' },
        { id: '4', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face&facepad=2&auto=format', name: 'Sarah Wilson' }
      ],
      status: 'Scheduled',
      tasks: { completed: 3, total: 3 },
      progress: 100,
      files: 2,
      comments: 1,
      dueDate: '3 May, 2025'
    }
  ];

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'In Progress': 'bg-green-100 text-green-800',
      'Pending Review': 'bg-yellow-100 text-yellow-800',
      'Overdue': 'bg-red-100 text-red-800',
      'In Review': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'Scheduled': 'bg-blue-100 text-blue-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getProgressBarClass(status: string): string {
    const progressClasses: { [key: string]: string } = {
      'In Progress': 'bg-green-500',
      'Pending Review': 'bg-yellow-500',
      'Overdue': 'bg-red-500',
      'In Review': 'bg-blue-500',
      'Completed': 'bg-purple-500',
      'Scheduled': 'bg-blue-500'
    };
    return progressClasses[status] || 'bg-gray-500';
  }
}