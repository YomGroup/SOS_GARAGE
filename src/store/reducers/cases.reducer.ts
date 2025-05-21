import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

export interface Case {
  id: string;
  reference: string;
  clientName: string;
  status: 'en_cours' | 'en_attente' | 'validé' | 'rejeté';
  type: 'assurance' | 'réparation';
  documents: {
    contratAssurance: boolean;
    carteGrise: boolean;
    devis: boolean;
    photos: boolean;
  };
  garage?: {
    id: string;
    name: string;
    status: 'en_attente' | 'validé' | 'rejeté';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface State extends EntityState<Case> {
  selectedCaseId: string | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: Case['status'];
    type?: Case['type'];
    hasMissingDocuments?: boolean;
    hasPendingGarage?: boolean;
  };
}

export const adapter: EntityAdapter<Case> = createEntityAdapter<Case>();

export const initialState: State = adapter.getInitialState({
  selectedCaseId: null,
  loading: false,
  error: null,
  filters: {}
});

export const reducer = createReducer(
  initialState,
  // Les actions seront ajoutées ici
);