import { createAction, props } from '@ngrx/store';
import { Case } from '../reducers/cases.reducer';

// Charger les dossiers
export const loadCases = createAction('[Cases] Load Cases');
export const loadCasesSuccess = createAction(
  '[Cases] Load Cases Success',
  props<{ cases: Case[] }>()
);
export const loadCasesFailure = createAction(
  '[Cases] Load Cases Failure',
  props<{ error: string }>()
);

// Sélectionner un dossier
export const selectCase = createAction(
  '[Cases] Select Case',
  props<{ caseId: string }>()
);

// Créer un nouveau dossier
export const createCase = createAction(
  '[Cases] Create Case',
  props<{ case: Omit<Case, 'id' | 'createdAt' | 'updatedAt'> }>()
);
export const createCaseSuccess = createAction(
  '[Cases] Create Case Success',
  props<{ case: Case }>()
);
export const createCaseFailure = createAction(
  '[Cases] Create Case Failure',
  props<{ error: string }>()
);

// Mettre à jour un dossier
export const updateCase = createAction(
  '[Cases] Update Case',
  props<{ case: Partial<Case> & { id: string } }>()
);
export const updateCaseSuccess = createAction(
  '[Cases] Update Case Success',
  props<{ case: Case }>()
);
export const updateCaseFailure = createAction(
  '[Cases] Update Case Failure',
  props<{ error: string }>()
);

// Supprimer un dossier
export const deleteCase = createAction(
  '[Cases] Delete Case',
  props<{ caseId: string }>()
);
export const deleteCaseSuccess = createAction(
  '[Cases] Delete Case Success',
  props<{ caseId: string }>()
);
export const deleteCaseFailure = createAction(
  '[Cases] Delete Case Failure',
  props<{ error: string }>()
);

// Filtrer les dossiers
export const setFilters = createAction(
  '[Cases] Set Filters',
  props<{
    status?: Case['status'];
    type?: Case['type'];
    hasMissingDocuments?: boolean;
    hasPendingGarage?: boolean;
  }>()
);

// Gérer les documents
export const uploadDocument = createAction(
  '[Cases] Upload Document',
  props<{
    caseId: string;
    documentType: keyof Case['documents'];
    file: File;
  }>()
);
export const uploadDocumentSuccess = createAction(
  '[Cases] Upload Document Success',
  props<{
    caseId: string;
    documentType: keyof Case['documents'];
  }>()
);
export const uploadDocumentFailure = createAction(
  '[Cases] Upload Document Failure',
  props<{ error: string }>()
);

// Gérer les garages
export const validateGarage = createAction(
  '[Cases] Validate Garage',
  props<{
    caseId: string;
    garageId: string;
    status: Case['garage'];
  }>()
);
export const validateGarageSuccess = createAction(
  '[Cases] Validate Garage Success',
  props<{
    caseId: string;
    garage: Case['garage'];
  }>()
);
export const validateGarageFailure = createAction(
  '[Cases] Validate Garage Failure',
  props<{ error: string }>()
); 