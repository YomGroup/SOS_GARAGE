import { createAction, props } from '@ngrx/store';

export const loadDashboardData = createAction(
  '[Dashboard] Load Dashboard Data'
);

export const loadDashboardDataSuccess = createAction(
  '[Dashboard] Load Dashboard Data Success',
  props<{ data: any }>()
);

export const loadDashboardDataFailure = createAction(
  '[Dashboard] Load Dashboard Data Failure',
  props<{ error: any }>()
);