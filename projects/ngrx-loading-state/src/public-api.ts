/*
 * Public API Surface of ngrx-loading-state
 */

export { initialise } from './lib/functions';
export { globalErrorReducerFactory } from './lib/global-error-reducer';
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
