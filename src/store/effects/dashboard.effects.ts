import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import * as DashboardActions from '../actions/dashboard.actions';

@Injectable()
export class DashboardEffects {
  private actions$ = inject(Actions);
  
  loadDashboard$ = createEffect(() => 
    this.actions$.pipe(
      ofType(DashboardActions.loadDashboardData),
      switchMap(() => {
        // In a real app, this would be an HTTP call to an API
        return of({ success: true, data: {} }).pipe(
          map(response => DashboardActions.loadDashboardDataSuccess({ data: response.data })),
          catchError(error => of(DashboardActions.loadDashboardDataFailure({ error })))
        );
      })
    )
  );
}