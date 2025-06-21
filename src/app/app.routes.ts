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

  // ✅ Accessible publiquement
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: '', component: ClientComponent },
    ]
  },

  // ✅ pages publiques
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'message', component: MessageComponent },

  { path: '', redirectTo: 'client', pathMatch: 'full' }
];
