import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ClientComponent } from './client.component';
import { ServicesComponent } from './pages/services/services.component';
import { ContactComponent } from './pages/contact/contact.component';

const routes: Routes = [
  {
    path: '',
    component: ClientComponent,   // layout client
    children: [
      { path: '', redirectTo: 'services', pathMatch: 'full' }, // page par défaut
      { path: 'services', component: ServicesComponent },
      { path: 'contact', component: ContactComponent },
      // tu rajouteras ici plus tard :
      // { path: 'process', component: ProcessComponent },
      // { path: 'about', component: AboutComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClientRoutingModule {}
