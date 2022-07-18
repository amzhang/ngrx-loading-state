import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterLoading } from '../lib/loading-state-effects';
import { fetchCount } from './simple.actions';
import { fetchCountSelectors } from './simple.selectors';
import { delay, map, of, switchMap } from 'rxjs';

@Injectable()
export class SimpleEffects {
  constructor(private actions$: Actions, private store: Store) {}

  fetchCount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fetchCount.load),
      filterLoading(this.store.select(fetchCountSelectors.state)),
      switchMap(() => {
        return of(2).pipe(
          delay(1),
          map((count) => fetchCount.success({ count })),
          fetchCount.catchError()
        );
      })
    );
  });
}
