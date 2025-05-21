import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export interface Garage {
  id: string;
  name: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
  status: string;
  rating: number;
  createdAt: string;
}

export interface State extends EntityState<Garage> {
  selectedGarageId: string | null;
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Garage> = createEntityAdapter<Garage>();

export const initialState: State = adapter.getInitialState({
  selectedGarageId: null,
  loading: false,
  error: null
});

export const reducer = createReducer(initialState);