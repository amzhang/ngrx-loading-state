import { ActionCreator, Creator, ReducerTypes } from '@ngrx/store';
import { Id, IdLoadingState } from './id-loading-state';
import { ErrorHandlerState, LoadingState, LoadingStateBase, LOADING_STATE } from './loading-state';

export const MAX_AGE_LATEST = 0;

export const INITIAL_LOADING_STATE_BASE: LoadingStateBase = Object.freeze({
  loading: false,
  success: false,
  issueFetch: false,
  errorHandlerState: ErrorHandlerState.INIT,
  successTimestamp: null,
  error: null
});

export const INITIAL_LOADING_STATE: LoadingState = Object.freeze({
  type: LOADING_STATE,
  ...INITIAL_LOADING_STATE_BASE
} as const);

export interface LoadingStates {
  [key: string]: LoadingState;
}

export interface IdLoadingStateMap {
  [key: Id]: IdLoadingState;
}

export interface IdLoadingStates {
  [key: string]: IdLoadingStateMap;
}

export interface WithLoadingStates {
  loadingStates: LoadingStates;
  idLoadingStates: IdLoadingStates;
}

export type OnState<State> = State extends infer S ? S : never;

export type LoadingActionsReducerTypes<State> = ReducerTypes<
  State,
  ActionCreator<string, Creator<any[], object>>[]
>;
