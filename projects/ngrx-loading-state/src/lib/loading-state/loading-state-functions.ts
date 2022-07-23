import { ActionCreatorProps, createAction, NotAllowedCheck, props } from '@ngrx/store';
import { Action } from '@ngrx/store/src/models';
import { lodash } from '../lodash';
import {
  ActionFactoryResult,
  CombinedLoadingState,
  ErrorHandlerState,
  FailureAction,
  LoadAction,
  LoadingState
} from './loading-state-types';

/**
 * See if a new API fetch should be issued.
 *
 * @param currentState The current loading state.
 * @param action The the LoadAction dispatched by the user.
 * @returns True if a new API fetch should be issued.
 */
export function shouldIssueFetch(
  currentState: Readonly<LoadingState>,
  action: Readonly<LoadAction>
): boolean {
  if (currentState == null) {
    return true;
  }

  const maxAge = action?.maxAge;

  // If action not given, then we err on the side of caution and always do a reload, even if
  // an API fetch is already happening.
  if (maxAge == null) {
    return true;
  } else {
    // Check if data not loaded or if too old.
    const reload =
      !currentState.successTimestamp || Date.now() - currentState.successTimestamp >= maxAge;

    // Do not issue duplicate loads if a fetch is already in progress
    return reload && !currentState.loading;
  }
}

/**
 * Return the type of error handler that should be used.
 *
 * @param currentState the current state
 * @param action the load action dispatched by the user
 * @param issueFetch whether the load action should issue a new API call.
 * @returns
 */
export function getErrorHandler(
  currentState: Readonly<LoadingState>,
  action: Readonly<LoadAction>,
  issueFetch: boolean
): ErrorHandlerState {
  if (currentState == null) {
    // If currentState does not exist, then errorHandlerState can be assumed to be initialised to ErrorHandlerState.INIT
    if (action.localError) {
      return ErrorHandlerState.LOCAL;
    } else {
      return ErrorHandlerState.GLOBAL;
    }
  }

  // If loading or issuing API fetch, then there is guaranteed to be a success/failure
  // action that the global error handler might need to handle.
  if (currentState.loading || issueFetch) {
    // If any load action sets the localError to true, then it disables the global error hander
    // until the success/failure action is handled.
    if (action.localError) {
      return ErrorHandlerState.LOCAL;
    } else if (currentState.errorHandlerState == ErrorHandlerState.INIT) {
      // If it's in the INIT state, then we use the default global handler because the
      // loading action has not requests for localError handler.
      return ErrorHandlerState.GLOBAL;
    }
    // else just fall through and return the existing errorHandler unchanged.
  }

  return currentState.errorHandlerState;
}

/**
 * This function make it easier to define the type of prop<T>. Internal use only.
 *
 * T extends object meets the condition of props function
 *
 * ref: https://stackoverflow.com/questions/65888508/how-to-use-generic-type-in-ngrx-createaction-props
 *
 * @param type String type of the action
 * @returns An action creator function
 */
export function actionFactory<T extends object>(type: string): ActionFactoryResult<T> {
  // Restricting config type to match createAction requirements
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAction(type, props<any>() as ActionCreatorProps<T> & NotAllowedCheck<T>);
}

/**
 * Make a clone of any object that implements the LoadingState interface, but copy over only
 * those fields that are in the LoadingState interface.
 *
 * @param src Any object that implements the LoadingState interface
 * @returns A copy of src with only fields from LoadingState
 */
export function cloneLoadingState(src: LoadingState): LoadingState {
  // Since the "src" could contain extra fields, we want to make sure we exclude other fields in the
  // comparison. Using Required<> to make sure we don't miss any fields.
  // Would be better if we can iterate all the fields in the LoadingStateBase interface. But unless we change
  // LoadingStateBase to a class, it doesn't seem likely. Below is verbose, but at least it should capture all
  // the fields.

  if (src == null) {
    return src;
  } else {
    // Using Required<> to ensure we don't miss any fields from LoadingStateBase.
    const ret: Required<LoadingState> = lodash.pick(src as Required<LoadingState>, [
      'isLoadingState',
      'loading',
      'success',
      'issueFetch',
      'errorHandlerState',
      'successTimestamp',
      'error'
    ]);

    return ret;
  }
}

/**
 * Combine the currentState and the user dispatched LoadAction into newState.
 *
 * @param action User dispatched LoadAction
 * @param currentState Current store state
 * @returns A new state if the state should change, null otherwise.
 */
export function getNewLoadState(
  action: LoadAction & Action,
  currentState: LoadingState
): Readonly<LoadingState> | null {
  const issueFetch = shouldIssueFetch(currentState, action);

  const errorHandlerState = getErrorHandler(currentState, action, issueFetch);

  const newState: LoadingState = issueFetch
    ? {
        isLoadingState: true,
        loading: true,
        success: false,
        issueFetch,
        errorHandlerState,
        successTimestamp: currentState?.successTimestamp,
        error: undefined
      }
    : {
        isLoadingState: true,
        // Deliberately avoiding the use of the spread operator, i.e. no ...currentState
        // because we want to be 100% explicit about the states we are setting. Using ...currentState
        // makes it difficult to read. Being explicit means we need to specify all fields
        // from LoadingState. If we ever add more states to LoadingState the typing will catch any
        // missing states. There's also just the loading(), success(), failure() functions
        // so not too cumbersome to be explicit.
        loading: currentState.loading,
        success: currentState.success,
        issueFetch,
        errorHandlerState,
        successTimestamp: currentState.successTimestamp,
        error: currentState.error
      };

  // Note that even if issueFetch is false, the errorHandlerState could still change. So we should
  // compare every field from old to new state.
  return lodash.isEqual(currentState, newState) ? null : newState;
}

/**
 * @returns Always returns a new success state.
 */
export function getNewSuccessState(): Readonly<LoadingState> {
  const ret: LoadingState = {
    isLoadingState: true,
    loading: false,
    success: true,
    issueFetch: false,
    // Each load action will set this again, so here we just set it back to default.
    errorHandlerState: ErrorHandlerState.INIT,
    // Since this time field changes, all SuccessAction will cause a state update.
    successTimestamp: Date.now(),
    error: undefined
  };

  return ret;
}

/**
 * Returns a new FailureState.
 *
 * @param action User dispatched FailureAction
 * @param currentState Current loading state
 * @returns A new loading state.
 */
export function getNewFailureState(
  action: FailureAction & Action,
  currentState: LoadingState
): Readonly<LoadingState> {
  return {
    isLoadingState: true,
    loading: false,
    success: false,
    issueFetch: false,
    // Leading this as is for the global error handler to check.
    errorHandlerState: currentState.errorHandlerState,
    successTimestamp: currentState.successTimestamp,
    error: action.error
  };
}

export function combineLoadingStates(loadingStates: LoadingState[]): CombinedLoadingState {
  return {
    loading: loadingStates.some((state) => !!state?.loading),
    success: loadingStates.every((state) => !!state?.success),
    error: loadingStates.find((state) => !!state?.error)?.error
  };
}
