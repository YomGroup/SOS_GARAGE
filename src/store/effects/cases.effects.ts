import { Injectable } from '@angular/core';
import { createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import * as CasesActions from '../actions/cases.actions';
import { BaseEffects } from './base.effects';

@Injectable()
export class CasesEffects extends BaseEffects {
  constructor(private http: HttpClient) {
    super();
  }

  // Charger les dossiers
  loadCases$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CasesActions.loadCases),
      mergeMap(() =>
        this.http.get<Case[]>('/api/cases').pipe(
          map(cases => CasesActions.loadCasesSuccess({ cases })),
          catchError(error => of(CasesActions.loadCasesFailure({ error: error.message })))
        )
      )
    )
  );

  // Créer un nouveau dossier
  createCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CasesActions.createCase),
      mergeMap(({ case: newCase }) =>
        this.http.post<Case>('/api/cases', newCase).pipe(
          map(createdCase => CasesActions.createCaseSuccess({ case: createdCase })),
          catchError(error => of(CasesActions.createCaseFailure({ error: error.message })))
        )
      )
    )
  );

  // Mettre à jour un dossier
  updateCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CasesActions.updateCase),
      mergeMap(({ case: updatedCase }) =>
        this.http.put<Case>(`/api/cases/${updatedCase.id}`, updatedCase).pipe(
          map((updatedCase: Case) => CasesActions.updateCaseSuccess({ case: updatedCase })),
          catchError(error => of(CasesActions.updateCaseFailure({ error: error.message })))
        )
      )
    )
  );

  // Supprimer un dossier
  deleteCase$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CasesActions.deleteCase),
      mergeMap(({ caseId }) =>
        this.http.delete(`/api/cases/${caseId}`).pipe(
          map(() => CasesActions.deleteCaseSuccess({ caseId })),
          catchError(error => of(CasesActions.deleteCaseFailure({ error: error.message })))
        )
      )
    )
  );

  // Uploader un document
  uploadDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CasesActions.uploadDocument),
      mergeMap(({ caseId, documentType, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        return this.http.post(`/api/cases/${caseId}/documents`, formData).pipe(
          map(() => CasesActions.uploadDocumentSuccess({ caseId, documentType })),
          catchError(error => of(CasesActions.uploadDocumentFailure({ error: error.message })))
        );
      })
    )
  );

  // Valider un garage
  validateGarage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CasesActions.validateGarage),
      mergeMap(({ caseId, garageId, status }) =>
        this.http.put(`/api/cases/${caseId}/garages/${garageId}`, { status }).pipe(
          map(response => CasesActions.validateGarageSuccess({
            caseId,
            garage: response as Case['garage']
          })),
          catchError(error => of(CasesActions.validateGarageFailure({ error: error.message })))
        )
      )
    )
  );
}