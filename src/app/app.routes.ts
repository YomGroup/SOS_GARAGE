import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layouts/layout.component';
import { ClientComponent } from './client/client.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';
import { VehiculesComponent } from './vehicules/vehicules.component';
import { DeclarationsComponent } from './declarations/declarations.component';
import { SupportComponent } from './support/support.component';
import { NotificationComponent } from './notification/notification.component';
import { EspaceclientComponent } from './espaceclient/espaceclient.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SinistreComponent } from './sinistre/sinistre.component';
import { DocumentComponent } from './document/document.component';
import { ProfileComponent } from './profile/profile.component';
import { MessageComponent } from './message/message.component';
import { AuthGuard } from './app/auth-guard.service';

export const routes: Routes = [
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [AuthGuard], // 🔒 protégé
    data: { roles: ['ROLE_ADMIN'] }, // Seul l'admin peut accéder
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
    canActivate: [AuthGuard], // 🔒 protégé
    data: { roles: ['ROLE_GARAGISTE'] }, // Seul le garagiste peut accéder
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/garage/garage.module').then(m => m.GarageModule)
      },
      {
        path: 'message',
        component: MessageComponent,
        data: { title: 'Mes Messages' }
      }
    ]
  },

  {
    path: 'clientDashboard',
    component: EspaceclientComponent,
    canActivate: [AuthGuard], // 🔒 protégé
    data: { roles: ['ROLE_ASSURE'] }, // Seul l'assuré peut accéder
    children: [
      { path: '', component: HomeComponent },
      { path: 'vehicules', component: VehiculesComponent, data: { title: 'Mes Véhicules' } },
      { path: 'declarations', component: DeclarationsComponent, data: { title: 'Mes Déclarations' } },
      { path: 'support', component: SupportComponent, data: { title: 'Support' } },
      { path: 'notification', component: NotificationComponent, data: { title: 'Notifications' } },
      { path: 'sinistre', component: SinistreComponent, data: { title: 'Mes Sinistres' } },
      { path: 'document', component: DocumentComponent, data: { title: 'Mes Documents' } },
      { path: 'message', component: MessageComponent, data: { title: 'Mes Messages' } },
      { path: 'profiles', component: ProfileComponent, data: { title: 'Mon Profil' } },
    ]
  },


  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: '', component: ClientComponent },
    ]
  },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: '', redirectTo: 'client', pathMatch: 'full' }
];
