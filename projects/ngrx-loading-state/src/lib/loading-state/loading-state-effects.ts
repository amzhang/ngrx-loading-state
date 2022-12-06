import { filter, map, Observable, pipe, UnaryFunction, withLatestFrom } from 'rxjs';
import { InternalLoadAction, LoadAction, LoadingState } from './loading-state-types';

/**
 * DEPRECATED
 *
 * Use filterIssueFetch() instead.
 *
 * A ngrx pipeline operator that filters out any actions that does not require the
 * issuing of API calls.
 *
 * Design: Note that whether the action should issue a fetch is done in the reducer, where the
 * loadingState.issueFetch parameter is updated. We can NOT combine the current state and the
 * action in the effect to decide if we need to issue an API call, because that could lead to race
 * conditions. The only guaranteed point of synchronous execution is the reducer.
 *
 * @param loadingState$ Observable that emit the current loading state from the store.
 * @returns Stream that only emits a LoadAction if that that load action should result in an API call.
 * @example
 *  fetchCount$ = createEffect(() => {
 *    return this.actions$.pipe(
 *      ofType(fetchCount.load),
 *      filterLoading(this.store.select(fetchCountSelectors.state)),
 *      switchMap((action) => {
 *        ...
 *      })
 *    );
 *  });
 *
 */
export function filterLoading<T>(
  loadingState$: Observable<LoadingState>
): UnaryFunction<Observable<T>, Observable<T>> {
  return pipe(
    withLatestFrom(loadingState$),
    filter(
      ([_, loadingState]: [T, LoadingState]) => loadingState == null || loadingState.issueFetch
    ),
    map(([action, _]: [T, LoadingState]) => action)
  );
}

/**
 * We include the issueFetch as a part of the action. This way we don't need the action to be
 * tightly synced with the state.
 *
 * @example
 *  fetchCount$ = createEffect(() => {
 *    return this.actions$.pipe(
 *      ofType(fetchCount.load),
 *      filterIssueFetch(),
 *      switchMap((action) => {
 *        ...
 *      })
 *    );
 *  });
 */
export function filterIssueFetch<T extends LoadAction>() {
  return filter((action: T) => !!(action as any as InternalLoadAction).issueFetch());
}
