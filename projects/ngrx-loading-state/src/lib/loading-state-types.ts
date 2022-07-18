export enum ErrorHandlerState {
  INIT = 'INIT',
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
}

// TODO Make this generic
type LoadingStateError = any;

export interface LoadingState {
  loading: boolean; // Api is loading
  success: boolean; // Api returned successfully
  issueFetch: boolean; // true if we should issue a fetch
  errorHandlerState: ErrorHandlerState;
  successTimestamp?: number; // Millisecond unix timestamp of when data is loaded. Date.now()
  error?: LoadingStateError; // Api returned error
}

export const INITIAL_LOADING_STATE = Object.freeze({
  loading: false,
  success: false,
  issueFetch: false,
  ErrorHandlerType: ErrorHandlerState.INIT,
  successTimestamp: undefined,
  error: undefined,
} as const);

export interface LoadingStates {
  [key: string]: LoadingState;
}

export interface WithLoadingStates {
  loadingStates: LoadingStates;
}

export function initialise(): LoadingStates {
  return {} as LoadingStates;
}

export interface LoadAction {
  // If there is existing data and the time since it was loaded does not exceed
  // the maxAge in milliseconds, then we can consider the value in the store valid. The loadingState.issueFetch
  // will be set to false in this case.
  maxAge?: number;
  // If true, any loading errors will not generate global error notifications.
  // Set this to true if your component wants to handle the error.
  // If there are multiple calls to dispatch load action, then if any of the
  // actions has localError == true, then the next failure action will be handled
  // locally and not show a global error.
  localError?: boolean;
}

export interface FailureAction {
  error?: LoadingStateError;
}
