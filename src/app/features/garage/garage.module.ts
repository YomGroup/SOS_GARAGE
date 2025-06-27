import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { GarageRoutingModule } from './garage-routing.module';
import { MessageComponent } from '../../message/message.component';
import { GarageProfileComponent } from './components/garage-profile/garage-profile.component';
import { MissionReceptionComponent } from './components/mission-reception/mission-reception.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    GarageRoutingModule,
    MessageComponent,
    GarageProfileComponent,
    MissionReceptionComponent
  ]
})
export class GarageModule { } 