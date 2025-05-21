import { ActionReducerMap } from '@ngrx/store';
import * as fromAuth from './auth.reducer';
import * as fromDashboard from './dashboard.reducer';
import * as fromCases from './cases.reducer';
import * as fromGarages from './garages.reducer';
import * as fromWrecks from './wrecks.reducer';
import * as fromUsers from './users.reducer';

export interface AppState {
  auth: fromAuth.State;
  dashboard: fromDashboard.State;
  cases: fromCases.State;
  garages: fromGarages.State;
  wrecks: fromWrecks.State;
  users: fromUsers.State;
}

export const rootReducers: ActionReducerMap<AppState> = {
  auth: fromAuth.reducer,
  dashboard: fromDashboard.reducer,
  cases: fromCases.reducer,
  garages: fromGarages.reducer,
  wrecks: fromWrecks.reducer,
  users: fromUsers.reducer
};