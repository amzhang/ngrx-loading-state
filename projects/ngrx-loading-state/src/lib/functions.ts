import { combineLatest, map, Observable } from 'rxjs';
import { LoadingStateBase } from './loading-state/loading-state-types';
import { WithLoadingStates } from './types';

export function getInitialState(): WithLoadingStates {
  return {
    loadingStates: {},
    idLoadingStates: {}
  };
}

export type CombinedLoadingState = Pick<LoadingStateBase, 'loading' | 'success' | 'error'>;

export function combineLatestLoadingStates(
  loadingStates$: Observable<LoadingStateBase>[]
): Observable<CombinedLoadingState> {
  return combineLatest(loadingStates$).pipe(
    map((loadingStates) => {
      return {
        loading: loadingStates.some((state) => !!state?.loading),
        success: loadingStates.every((state) => !!state?.success),
        error: loadingStates.find((state) => !!state?.error)?.error
      };
    })
  );
}
