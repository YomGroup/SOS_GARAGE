import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParametreComponent } from './parametre.component';
import { PreferencesManagementComponent } from './preferences-management/preferences-management.component';
import { NotificationManagementComponent } from './notification-management/notification-management.component';
import { SecurityManagementComponent } from './security-management/security-management.component';
import { CustomizationManagementComponent } from './customization-management/customization-management.component';

const routes: Routes = [
  {
    path: '',
    component: ParametreComponent,
    children: [
      { path: 'preferences-management', component: PreferencesManagementComponent },
      { path: 'notification-management', component: NotificationManagementComponent },
      { path: 'security-management', component: SecurityManagementComponent },
      { path: 'customization-management', component: CustomizationManagementComponent },
      { path: '', redirectTo: 'preferences-management', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParametreRoutingModule {} 