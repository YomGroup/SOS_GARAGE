import { Injectable, inject } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';

@Injectable()
export class UsersEffects {
  private actions$ = inject(Actions);
  
  // Effects will be implemented as features are built out
}