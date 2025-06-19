import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layouts/layout.component';
import { DashboardAdminComponent } from './features/admin/dashboard/dashboard-admin/dashboard-admin.component';
import { ClientComponent } from './client/client.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';
import { VehiculesComponent } from './vehicules/vehicules.component';
import { DeclarationsComponent } from './declarations/declarations.component';
import { SupportComponent } from './support/support.component';
import { NotificationComponent } from './notification/notification.component';
import { EspaceclientComponent } from './espaceclient/espaceclient.component';
import { HomeDashboardComponent } from './home-dashboard/home-dashboard.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SinistreComponent } from './sinistre/sinistre.component';
import { DocumentComponent } from './document/document.component';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { MessageComponent } from './message/message.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/admin/admin.module').then(m => m.AdminModule)
      }
    ]
  },
  {
    path: 'garage',
    component: LayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/garage/garage.module').then(m => m.GarageModule)
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'clientDashboard',
    component: EspaceclientComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'vehicules', component: VehiculesComponent },
      { path: 'declarations', component: DeclarationsComponent },
      { path: 'support', component: SupportComponent },
      { path: 'notification', component: NotificationComponent },
      { path: 'sinistre', component: SinistreComponent },
      { path: 'document', component: DocumentComponent },
      { path: 'message', component: MessageComponent },
      { path: 'profiles', component: ProfileComponent }
    ]
  },
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: '', component: ClientComponent },
      { path: 'vehicules', component: VehiculesComponent },
      { path: 'declarations', component: DeclarationsComponent },
      { path: 'support', component: SupportComponent },
      { path: 'notification', component: NotificationComponent },
      { path: 'sinistre', component: SinistreComponent },
      { path: 'document', component: DocumentComponent },
      { path: 'message', component: MessageComponent },
      { path: 'profile', component: ProfileComponent }
    ]
  },
  {
    path: 'message',
    component: MessageComponent
  },
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  }
];
