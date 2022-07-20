/*
 * Public API Surface of ngrx-loading-state
 */

export { FailureAction, LoadAction, LoadingState } from './lib/loading-state';
export {
  createLoadingActions,
  createLoadingStatesSelector,
  failure,
  load,
  success
} from './lib/loading-state-creators';
export { filterLoading } from './lib/loading-state-effects';
export { initialise } from './lib/loading-state-functions';
export { globalErrorReducerFactory } from './lib/loading-state-global-error-reducer';
export { MAX_AGE_LATEST, WithLoadingStates } from './lib/loading-state-types';
