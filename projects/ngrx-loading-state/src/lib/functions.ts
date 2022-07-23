import { combineLatest, map, Observable } from 'rxjs';
import { combineLoadingStates } from './loading-state/loading-state-functions';
import { CombinedLoadingState, LoadingStateBase } from './loading-state/loading-state-types';
import { WithLoadingStates } from './types';

export function getInitialState(): WithLoadingStates {
  return {
    loadingStates: {},
    idLoadingStates: {}
  };
}

export function combineLatestLoadingStates(
  loadingStates$: Observable<LoadingStateBase>[]
): Observable<CombinedLoadingState> {
  return combineLatest(loadingStates$).pipe(
    map((loadingStates) => {
      return combineLoadingStates(loadingStates);
    })
  );
}
