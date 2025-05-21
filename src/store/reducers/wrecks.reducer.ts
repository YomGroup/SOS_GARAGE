import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export interface Wreck {
  id: string;
  caseId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: string;
  estimatedValue: number;
  photos: string[];
  createdAt: string;
}

export interface State extends EntityState<Wreck> {
  selectedWreckId: string | null;
  loading: boolean;
  error: string | null;
}

export const adapter: EntityAdapter<Wreck> = createEntityAdapter<Wreck>();

export const initialState: State = adapter.getInitialState({
  selectedWreckId: null,
  loading: false,
  error: null
});

export const reducer = createReducer(initialState);