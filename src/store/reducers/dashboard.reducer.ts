import { createReducer, on } from '@ngrx/store';
import * as DashboardActions from '../actions/dashboard.actions';

export interface State {
  data: any | null;
  loading: boolean;
  error: string | null;
}

export const initialState: State = {
  data: null,
  loading: false,
  error: null
};

export const reducer = createReducer(
  initialState,
  on(DashboardActions.loadDashboardData, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(DashboardActions.loadDashboardDataSuccess, (state, { data }) => ({
    ...state,
    data,
    loading: false,
    error: null
  })),
  on(DashboardActions.loadDashboardDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);