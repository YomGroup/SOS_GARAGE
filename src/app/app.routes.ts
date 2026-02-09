import { Routes } from '@angular/router';
import { LayoutComponent } from './shared/layouts/layout.component';
import { ClientComponent } from './client/client.component';
import { ClientLayoutComponent } from './client-layout/client-layout.component';
import { VehiculesComponent } from './vehicules/vehicules.component';
import { DeclarationsComponent } from './declarations/declarations.component';
// import { SupportComponent } from './support/support.component';
import { NotificationComponent } from './notification/notification.component';
import { EspaceclientComponent } from './espaceclient/espaceclient.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SinistreComponent } from './sinistre/sinistre.component';
import { DocumentComponent } from './document/document.component';
import { ProfileComponent } from './profile/profile.component';
import { MessageComponent } from './shared/components/message/message.component';
import { AuthGuard } from './app/auth-guard.service';
import { DocumentSigningComponent } from './document-signing/document-signing.component';
import { ServicesComponent } from './client/pages/services/services.component';
import { ContactComponent } from './client/pages/contact/contact.component';
import { CommentCaMarcheComponent } from './client/pages/comment-ca-marche/comment-ca-marche.component';
import { MentionsLegalesComponent } from './client/pages/legal/mentions-legales/mentions-legales.component';
import { ConditionsUtilisationComponent } from './client/pages/legal/conditions-utilisation/conditions-utilisation.component';
import { PolitiqueConfidentialiteComponent } from './client/pages/legal/politique-confidentialite/politique-confidentialite.component';
import { CookiesComponent } from './client/pages/legal/cookies/cookies.component';
import { SupportComponent } from './client/pages/legal/support/support.component';



export const routes: Routes = [
  // Page publique pour comptes garages non validés
  {
    path: 'garage-pending',
    loadComponent: () => import('./garage-pending/garage-pending.component').then(m => m.GaragePendingComponent)
  },
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

    
      //{ path: 'message', component: MessageComponent, data: { title: 'Mes Messages' } },
      {
          path: 'message',
          loadComponent: () =>
            import('./shared/components/message/message.component')
              .then(m => m.MessageComponent)
        },
      { path: 'profiles', component: ProfileComponent, data: { title: 'Mon Profil' } },
      { path: 'pdf/:id', component: DocumentSigningComponent }
    ]
  },


  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
    { path: '', component: ClientComponent },
    { path: 'services', component: ServicesComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'comment-ca-marche', component: CommentCaMarcheComponent },
    { path: 'mentions-legales', component: MentionsLegalesComponent },
    { path: 'conditions-utilisation', component: ConditionsUtilisationComponent },
    { path: 'politique-confidentialite', component: PolitiqueConfidentialiteComponent },
    { path: 'cookies', component: CookiesComponent },
    { path: 'support', component: SupportComponent }
    
  ]

  },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'register/assure', component: RegisterComponent, data: { forcedUserType: 'assure' } },
  { path: 'register/garagiste', component: RegisterComponent, data: { forcedUserType: 'garagiste' } },
  //{ path: 'message', component: MessageComponent },

  { path: '', redirectTo: 'client', pathMatch: 'full' }
];
