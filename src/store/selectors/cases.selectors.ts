import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State, adapter } from '../reducers/cases.reducer';

export const selectCasesState = createFeatureSelector<State>('cases');

export const {
  selectAll: selectAllCases,
  selectEntities: selectCasesEntities,
  selectIds: selectCasesIds,
  selectTotal: selectCasesTotal
} = adapter.getSelectors(selectCasesState);

export const selectSelectedCaseId = createSelector(
  selectCasesState,
  (state: State) => state.selectedCaseId
);

export const selectSelectedCase = createSelector(
  selectCasesEntities,
  selectSelectedCaseId,
  (entities, selectedId) => selectedId ? entities[selectedId] : null
);

export const selectCasesLoading = createSelector(
  selectCasesState,
  (state: State) => state.loading
);

export const selectCasesError = createSelector(
  selectCasesState,
  (state: State) => state.error
);

export const selectCasesFilters = createSelector(
  selectCasesState,
  (state: State) => state.filters
);

export const selectFilteredCases = createSelector(
  selectAllCases,
  selectCasesFilters,
  (cases, filters) => {
    return cases.filter(case => {
      if (filters.status && case.status !== filters.status) {
        return false;
      }
      if (filters.type && case.type !== filters.type) {
        return false;
      }
      if (filters.hasMissingDocuments) {
        const hasMissing = !case.documents.contratAssurance ||
          !case.documents.carteGrise ||
          !case.documents.devis ||
          !case.documents.photos;
        if (!hasMissing) {
          return false;
        }
      }
      if (filters.hasPendingGarage) {
        if (!case.garage || case.garage.status !== 'en_attente') {
          return false;
        }
      }
      return true;
    });
  }
); 