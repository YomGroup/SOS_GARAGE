import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/models/user.model';
import * as AuthActions from '../actions/auth.actions';

export interface State {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
}

export const initialState: State = {
  user: null,
  isAuthenticated: false,
  error: null
};

export const reducer = createReducer(
  initialState,
  on(AuthActions.login, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    error: null
  })),
  on(AuthActions.logout, state => ({
    ...state,
    user: null,
    isAuthenticated: false,
    error: null
  })),
  on(AuthActions.refreshToken, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    error: null
  }))
);