import { IdLoadingState } from './id-loading-state';
import { ErrorHandlerState, LoadingState, LoadingStateError, LOADING_STATE } from './loading-state';

export const MAX_AGE_LATEST = 0;

export const INITIAL_LOADING_STATE: LoadingState = Object.freeze({
  type: LOADING_STATE,
  loading: false,
  success: false,
  issueFetch: false,
  errorHandlerState: ErrorHandlerState.INIT,
  successTimestamp: undefined,
  error: undefined
} as const);

export interface LoadingStates {
  [key: string]: LoadingState;
}

export interface IdLoadingStates {
  [key: string]: IdLoadingState;
}

export interface WithLoadingStates {
  loadingStates: LoadingStates;
  idLoadingStates: IdLoadingStates;
}
