/*
 * Public API Surface of ngrx-loading-state
 */

export {
  createLoadingActions,
  createLoadingStatesSelector,
  failure,
  load,
  success
} from './lib/loading-state-creators';
export { filterLoading } from './lib/loading-state-effects';
export { globalErrorReducerFactory } from './lib/loading-state-global-error-reducer';
export {
  FailureAction,
  initialise,
  LoadAction,
  LoadingState,
  MAX_AGE_LATEST,
  WithLoadingStates
} from './lib/loading-state-types';
