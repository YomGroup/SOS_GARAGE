import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GarageComponent } from './garage.component';
import { MissionReceptionComponent } from './components/mission-reception/mission-reception.component';
import { ReparationManagementComponent } from './components/reparation-management/reparation-management.component';
import { CommunicationComponent } from './components/communication/communication.component';
import { StatisticsComponent } from './components/statistics/statistics.component';
import { MessageComponent } from '../../message/message.component';

const routes: Routes = [
  {
    path: '',
    component: GarageComponent,
    children: [
      { path: 'missions', component: MissionReceptionComponent },
      { path: 'reparations', component: ReparationManagementComponent },
      { path: 'communication', component: CommunicationComponent },
      { path: 'statistiques', component: StatisticsComponent },
      { path: 'message', component: MessageComponent },
      { path: '', redirectTo: 'missions', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GarageRoutingModule { } 