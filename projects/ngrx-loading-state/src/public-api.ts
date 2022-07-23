/*
 * Public API Surface of ngrx-loading-state
 */

export { getInitialState } from './lib/functions';
export { globalErrorReducerFactory } from './lib/global-error-reducer';
export {
  createIdLoadingActions,
  createIdLoadingStatesSelector,
  idFailure,
  idLoad,
  idSuccess
} from './lib/id-loading-state/id-loading-state-creators';
export {
  createLoadingActions,
  createLoadingStatesSelector,
  failure,
  load,
  success
} from './lib/loading-state/loading-state-creators';
export { filterLoading } from './lib/loading-state/loading-state-effects';
export {
  FailureAction,
  LoadAction,
  LoadingState,
  MAX_AGE_LATEST
} from './lib/loading-state/loading-state-types';
export { WithLoadingStates } from './lib/types';
