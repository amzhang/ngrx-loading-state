import { ActionCreator, Creator, ReducerTypes } from '@ngrx/store';

export const MAX_AGE_LATEST = 0;

export enum ErrorHandlerState {
  INIT = 'INIT',
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL'
}

export type OnState<State> = State extends infer S ? S : never;

// TODO Make this generic
export type LoadingStateError = any;

export interface LoadingStateBase {
  loading: boolean; // Api is loading
  success: boolean; // Api returned successfully
  issueFetch: boolean; // true if we should issue a fetch
  errorHandlerState: ErrorHandlerState;
  successTimestamp?: number; // Millisecond unix timestamp of when data is loaded. Date.now()
  error?: LoadingStateError; // Api returned error
}

export const LOADING_STATE = 'LOADING_STATE' as const;

export interface LoadingState extends LoadingStateBase {
  type: typeof LOADING_STATE; // For dynamic type checking
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

export type LoadingActionsReducerTypes<State> = ReducerTypes<
  State,
  ActionCreator<string, Creator<any[], object>>[]
>;

export interface LoadingStates {
  [key: string]: LoadingState;
}

export const INITIAL_LOADING_STATE_BASE: LoadingStateBase = Object.freeze({
  loading: false,
  success: false,
  issueFetch: false,
  errorHandlerState: ErrorHandlerState.INIT,
  successTimestamp: undefined,
  error: undefined
});

export const INITIAL_LOADING_STATE: LoadingState = Object.freeze({
  type: LOADING_STATE,
  ...INITIAL_LOADING_STATE_BASE
} as const);

export interface WithLoadingStatesOnly {
  loadingStates: LoadingStates;
}
