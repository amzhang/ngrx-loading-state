import { FailureAction, LoadAction, LoadingState } from '../loading-state/loading-state-types';

export const ID_LOADING_STATE = 'ID_LOADING_STATE' as const;

export type Id = string;

export interface IdLoadingState extends LoadingState {
  /** For dynamic type checking */
  isIdLoadingState: true;
  /** ID to identify this state */
  id: Id | null;
}

export interface IdLoadAction extends LoadAction {
  id: Id;
}

export interface IdSuccessAction {
  id: Id;
}

export interface IdFailureAction extends FailureAction {
  id: Id;
}

export interface IdLoadingStateMap {
  [key: Id]: IdLoadingState;
}

export interface IdLoadingStates {
  [key: string]: IdLoadingStateMap;
}

export interface WithIdLoadingStatesOnly {
  idLoadingStates: IdLoadingStates;
}
