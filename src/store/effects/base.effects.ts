import { inject } from '@angular/core';
import { Actions } from '@ngrx/effects';

export abstract class BaseEffects {
  protected actions$ = inject(Actions);
} 