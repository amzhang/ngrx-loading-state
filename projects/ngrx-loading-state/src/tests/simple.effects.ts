import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { delay, map, of, switchMap } from 'rxjs';
import { filterLoading } from '../public-api';
import { fetchCount, fetchIdCount } from './simple.actions';
import { fetchCountSelectors, fetchIdCountSelectors } from './simple.selectors';

@Injectable()
export class SimpleEffects {
  static apiCalls = 0;

  constructor(private actions$: Actions, private store: Store) {}

  fetchCount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fetchCount.load),
      filterLoading(this.store.select(fetchCountSelectors.state)),
      switchMap((action) => {
        SimpleEffects.apiCalls += 1;

        return of(true).pipe(
          delay(1), // Ensure yielding into event loop.
          map(() => {
            if (action.forceFailure) {
              throw new Error('Forced failure');
            }
            return fetchCount.success({ count: action.count });
          }),
          fetchCount.catchError()
        );
      })
    );
  });

  fetchIdCount$ = fetchIdCount.createEffect(this.actions$, (idActions$, id) => {
    return idActions$.pipe(
      filterLoading(this.store.select(fetchIdCountSelectors.state(id))),
      switchMap((action) => {
        SimpleEffects.apiCalls += 1;
        return of(true).pipe(
          delay(1), // Ensure yielding into event loop.
          map(() => {
            if (action.forceFailure) {
              throw new Error('Forced failure');
            }
            return fetchIdCount.idSuccess({ id, count: action.count });
          }),
          fetchIdCount.catchError(id)
        );
      })
    );
  });
}
