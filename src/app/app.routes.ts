import { Routes } from '@angular/router';
import { DashboardAdminComponent } from './features/admin/dashboard/dashboard-admin/dashboard-admin.component';

export const routes: Routes = [
    {
      path: 'admin',
      loadChildren: () =>
        import('./features/admin/admin.module').then(m => m.AdminModule)
    },
    {
      path: '',
      redirectTo: 'admin',
      pathMatch: 'full'
    }
  ];
