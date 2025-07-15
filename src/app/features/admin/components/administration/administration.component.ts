import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { AccessManagementComponent } from './access-management/access-management.component';
import { AdminStatsComponent } from './admin-stats/admin-stats.component';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [
    RouterModule,
    UserManagementComponent,
    AuditLogsComponent,
    AccessManagementComponent,
    AdminStatsComponent
  ],
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.css']
})
export class AdministrationComponent {} 