import { ActionCreatorProps, createAction, NotAllowedCheck, props } from '@ngrx/store';
import { Action, ActionCreator, TypedAction } from '@ngrx/store/src/models';
import { lodash } from '../lodash';
import {
  ErrorHandlerState,
  FailureAction,
  LoadAction,
  LoadingStateBase
} from './loading-state-types';

export function shouldIssueFetch(
  oldState: Readonly<LoadingStateBase>,
  action: Readonly<LoadAction>
): boolean {
  const maxAge = action?.maxAge;

  // If action not given, then we err on the side of caution and always do a reload, even if
  // a load is already happening.
  if (maxAge == null) {
    return true;
  } else {
    // Check if data not loaded or if too old.
    const reload = !oldState.successTimestamp || Date.now() - oldState.successTimestamp >= maxAge;

    // Do not issue duplicate loads if a fetch is already in progress
    return reload && !oldState.loading;
  }
}

export function getErrorHandler(
  oldState: Readonly<LoadingStateBase>,
  action: Readonly<LoadAction>,
  issueFetch: boolean
): ErrorHandlerState {
  // If loading or issuing API fetch, then there is guaranteed to be a success/failure
  // action that the global error handler might need to handle.
  if (oldState.loading || issueFetch) {
    // If any load action sets the localError to true, then it disables the global error hander
    // until the success/failure action is handled.
    if (action.localError) {
      return ErrorHandlerState.LOCAL;
    } else if (oldState.errorHandlerState == ErrorHandlerState.INIT) {
      // If it's in the INIT state, then we use the default global handler because the
      // loading action has not requests for localError handler.
      return ErrorHandlerState.GLOBAL;
    }
    // else just fall through and return the existing errorHandler unchanged.
  }

  return oldState.errorHandlerState;
}

export type ActionFactoryResult<T extends object> = ActionCreator<
  string,
  (props: T & NotAllowedCheck<T>) => T & TypedAction<string>
>;

/**
 * This function make it easier to define the type of prop<T>. Internal use only.
 *
 * @param type String type of the action
 * @returns An action creator function
 */
// T extends object meets the condition of props function
// ref: https://stackoverflow.com/questions/65888508/how-to-use-generic-type-in-ngrx-createaction-props
export function actionFactory<T extends object>(type: string): ActionFactoryResult<T> {
  // restricting config type to match createAction requirements
  // TODO: https://lifeready.atlassian.net/browse/LIFE-481
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAction(type, props<any>() as ActionCreatorProps<T> & NotAllowedCheck<T>);
}

export function cloneLoadingStateBase(src: LoadingStateBase): LoadingStateBase {
  // Since the oldState could contain extra fields, we can't to make sure we exclude other fields in the
  // comparison. Use Required to make sure we don't miss any fields.
  // Would be better if we can iterate all the fields in the LoadingStateBase interface. But unless we change
  // LoadingStateBase to a class, it doesn't seem likely. Below is verbose, but at least it should capture all
  // the fields.

  // Using Required<> to ensure we don't miss any fields from LoadingStateBase.
  const ret: Required<LoadingStateBase> = lodash.pick(src as Required<LoadingStateBase>, [
    'loading',
    'success',
    'issueFetch',
    'errorHandlerState',
    'successTimestamp',
    'error'
  ]);

  return ret;
}

export function getNewLoadState(
  action: LoadAction & Action,
  oldState: LoadingStateBase
): Readonly<LoadingStateBase> | null {
  const issueFetch = shouldIssueFetch(oldState, action);

  const errorHandlerState = getErrorHandler(oldState, action, issueFetch);

  // Note that even if issueFetch is false, the errorHandlerState could still change. So we should
  // compare every field from old to new state.

  const newState: LoadingStateBase = issueFetch
    ? {
        loading: true,
        success: false,
        issueFetch,
        errorHandlerState,
        successTimestamp: oldState.successTimestamp,
        error: undefined
      }
    : {
        // Deliberately avoiding the use of the spread operator, i.e. no ...oldState
        // because we want to be 100% explicit about the states we are setting. Using ...oldState
        // makes it difficult to read. Being explicit means we need to specify all fields
        // from LoadingState. If we ever add more states to LoadingState the typing will catch any
        // missing states. There's also just the loading(), success(), failure() functions
        // so not too cumbersome to be explicit.
        loading: oldState.loading,
        success: oldState.success,
        issueFetch,
        errorHandlerState,
        successTimestamp: oldState.successTimestamp,
        error: oldState.error
      };

  return lodash.isEqual(oldState, newState) ? null : newState;
}

export function getNewSuccessState(): Readonly<LoadingStateBase> {
  const ret: LoadingStateBase = {
    loading: false,
    success: true,
    issueFetch: false,
    // each load action will set this again, so here we just set it back to default.
    errorHandlerState: ErrorHandlerState.INIT,
    successTimestamp: Date.now(),
    error: undefined
  };

  return ret;
}

export function getNewFailureState(
  action: FailureAction & Action,
  oldState: LoadingStateBase
): Readonly<LoadingStateBase> {
  return {
    loading: false,
    success: false,
    issueFetch: false,
    // Leading this as is for the global error handler to check.
    errorHandlerState: oldState.errorHandlerState,
    successTimestamp: oldState.successTimestamp,
    error: action.error
  };
}
