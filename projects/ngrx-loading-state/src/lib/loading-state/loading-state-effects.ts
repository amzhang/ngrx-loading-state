import { filter, map, Observable, pipe, UnaryFunction, withLatestFrom } from 'rxjs';
import { LoadingState } from './loading-state-types';

export function filterLoading<T>(
  loadingState$: Observable<LoadingState>
): UnaryFunction<Observable<T>, Observable<T>> {
  return pipe(
    withLatestFrom(loadingState$),
    filter(([_, loadingState]: [T, LoadingState]) => loadingState.issueFetch),
    map(([action, _]: [T, LoadingState]) => action)
  );
}
