import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DashboardData } from '../effects/dashboard.effects';

// Ce nom ('dashboard') doit correspondre à celui que vous utiliserez 
// lorsque vous enregistrerez le reducer dans votre module principal.
export const selectDashboardState = createFeatureSelector<DashboardData>('dashboard');

export const selectAllDashboardData = createSelector(
  selectDashboardState,
  (state: DashboardData) => state
);

export const selectDashboardUsers = createSelector(
  selectDashboardState,
  (state: DashboardData) => state.users
);

export const selectDashboardGarages = createSelector(
  selectDashboardState,
  (state: DashboardData) => state.garages
); 