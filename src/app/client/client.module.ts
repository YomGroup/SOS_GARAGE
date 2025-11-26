import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClientRoutingModule } from './client-routing.module';
import { ClientComponent } from './client.component';

import { ServicesComponent } from './pages/services/services.component';
import { ContactComponent } from './pages/contact/contact.component';

@NgModule({
  declarations: [
    ClientComponent,
    ServicesComponent,
    ContactComponent,
  ],
  imports: [
    CommonModule,
    ClientRoutingModule,
  ],
})
export class ClientModule {}
