import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Store } from '@ngrx/store';

import { StatCardComponent } from '../../../../shared/components/charts/stat-card.component';
import { LineChartComponent } from '../../../../shared/components/charts/line-chart.component';
import { BarChartComponent } from '../../../../shared/components/charts/bar-chart.component';
import { DoughnutChartComponent } from '../../../../shared/components/charts/doughnut-chart.component';
import { RecentActivityComponent } from '../recent-activity.component';

import { loadDashboardData } from '../../../../../store/actions/dashboard.actions';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTableModule,
    MatTabsModule,
    MatButtonToggleModule,
    StatCardComponent,
    LineChartComponent,
    BarChartComponent,
    DoughnutChartComponent,
    RecentActivityComponent,
  ],
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit {
  private store = inject(Store);

  ngOnInit() {
    this.store.dispatch(loadDashboardData());
  }
}
