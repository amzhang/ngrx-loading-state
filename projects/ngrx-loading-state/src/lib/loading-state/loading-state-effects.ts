import { filter, map, Observable, pipe, UnaryFunction, withLatestFrom } from 'rxjs';
import { LoadingStateBase } from './loading-state-types';

export function filterLoading<T>(
  loadingState$: Observable<LoadingStateBase>
): UnaryFunction<Observable<T>, Observable<T>> {
  return pipe(
    withLatestFrom(loadingState$),
    filter(
      ([_, loadingState]: [T, LoadingStateBase]) => loadingState == null || loadingState.issueFetch
    ),
    map(([action, _]: [T, LoadingStateBase]) => action)
  );
}
