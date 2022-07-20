import { FailureAction, LoadAction, LoadingStateBase } from './loading-state';
import { INITIAL_LOADING_STATE_BASE } from './loading-state-types';

export const ID_LOADING_STATE = 'ID_LOADING_STATE' as const;

export type Id = string | number;

export interface IdLoadingState extends LoadingStateBase {
  type: typeof ID_LOADING_STATE; // For dynamic type checking
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

export const INITIAL_ID_LOADING_STATE: IdLoadingState = Object.freeze({
  ...INITIAL_LOADING_STATE_BASE,
  type: ID_LOADING_STATE,
  id: null
} as const);
