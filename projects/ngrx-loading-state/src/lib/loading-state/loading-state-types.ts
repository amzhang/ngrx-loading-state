import { ActionCreator, Creator, NotAllowedCheck, ReducerTypes } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';

/**
 * Using this constant for the maxAge parameter will issue an API load if there is no
 * on going API call, irrespective of the current age of the previous load action.
 */
export const MAX_AGE_LATEST = 0;

/**
 * These are used by the global error reducer to keep track of whether error events have
 * already been handled
 */
export enum FailureHandlerState {
  INIT = 'INIT',
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL'
}

// TODO Make this generic
export type LoadingStateError = any;

/**
 * String constant for dynamic type checking.
 *
 * Alternatively, we could use a class instead of interfaces.
 *
 */
export interface LoadingState {
  /** For dynamic type checking */
  isLoadingState: true;
  /** API is loading */
  loading: boolean;
  /** Api returned successfully */
  success: boolean;
  /** True if we should issue an API call. Mostly for internal use */
  issueFetch: boolean;
  /** Tells the global error reducer how to handle this error.  */
  failureHandlerState: FailureHandlerState;
  /** Millisecond unix timestamp of when data is loaded */
  successTimestamp?: number;
  /** Last error returned by the API */
  error?: LoadingStateError; // Api returned error
}

export interface LoadAction {
  /**
   * If there is existing data and the time since it was loaded does not exceed
   * the maxAge in milliseconds, then we can consider the value in the store valid.
   * The loadingState.issueFetch will be set to false in this case.
   *
   * If this parameter is not provided, then an API call is issued immediately even
   * if there is already an API in progress.
   */
  maxAge?: number;
  /**
   * If true, any loading errors will not generate global error notifications.
   * Set this to true if your component wants to handle the error.
   * If there are multiple calls to dispatch load action, and if any of the
   * actions has localError == true, then the next failure action will be handled
   * locally instead of showing a global error.
   */
  localError?: boolean;
}

export interface FailureAction {
  /**
   * Error from the API
   */
  error?: LoadingStateError;
}

/**
 * Typing for the set of reducers created as a part of creating a loading action.
 */
export type LoadingActionsReducerTypes<State> = ReducerTypes<
  State,
  ActionCreator<string, Creator<any[], object>>[]
>;

/**
 * Key is the 'type' of the action. eg. "Fetch users", "Create Booking"
 */
export interface LoadingStates {
  [key: string]: LoadingState;
}

/**
 * Store state need to implement this to hold the loading states.
 * eg.
 *
 * export type SimpleState = WithLoadingStates & {
 *   count: number;
 *   profile: string;
 *   ...
 * };
 *
 */
export interface WithLoadingStatesOnly {
  loadingStates: LoadingStates;
}

/**
 * Merging multiple loading states together.
 */
export type CombinedLoadingState = Pick<LoadingState, 'loading' | 'success' | 'error'>;

// ----------------------------------------------------------------
// Internal use
// ----------------------------------------------------------------
export type OnState<State> = State extends infer S ? S : never;
export type ActionFactoryResult<T extends object> = ActionCreator<
  string,
  (props: T & NotAllowedCheck<T>) => T & TypedAction<string>
>;
