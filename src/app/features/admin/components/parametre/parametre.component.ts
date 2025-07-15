import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PreferencesManagementComponent } from './preferences-management/preferences-management.component';
import { NotificationManagementComponent } from './notification-management/notification-management.component';
import { SecurityManagementComponent } from './security-management/security-management.component';
import { CustomizationManagementComponent } from './customization-management/customization-management.component';

@Component({
  selector: 'app-parametre',
  standalone: true,
  imports: [
    RouterModule,
    PreferencesManagementComponent,
    NotificationManagementComponent,
    SecurityManagementComponent,
    CustomizationManagementComponent
  ],
  templateUrl: './parametre.component.html',
  styleUrls: ['./parametre.component.css']
})
export class ParametreComponent {} 