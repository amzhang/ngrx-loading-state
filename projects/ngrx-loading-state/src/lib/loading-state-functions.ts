import {
  ActionCreatorProps,
  createAction,
  NotAllowedCheck,
  props,
} from '@ngrx/store';
import { ActionCreator, TypedAction } from '@ngrx/store/src/models';
import { LoadingActions } from './loading-state-actions';
import {
  ErrorHandlerState,
  INITIAL_LOADING_STATE,
  LoadAction,
  LoadingState,
  LoadingStates,
} from './loading-state-types';
import { lodash } from './lodash';

export function shouldIssueFetch(
  oldState: Readonly<LoadingState>,
  action: Readonly<LoadAction>
): boolean {
  const maxAge = action?.maxAge;

  // If action not given, then we err on the side of caution and always do a reload, even if
  // a load is already happening.
  if (maxAge == null) {
    return true;
  } else {
    // Check if data not loaded or if too old.
    const reload =
      !oldState.successTimestamp ||
      Date.now() - oldState.successTimestamp >= maxAge;

    // Do not issue duplicate loads if a fetch is already in progress
    return reload && !oldState.loading;
  }
}

export function getErrorHandler(
  oldState: Readonly<LoadingState>,
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

export function distinctState(
  oldState: Readonly<LoadingState>,
  newState: Readonly<LoadingState>
): Readonly<LoadingState> {
  // Return the same object reference if the state has not changed. This
  // avoids unnecessary firing of selectors
  return lodash.isEqual(oldState, newState) ? oldState : newState;
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
export function actionFactory<T extends object>(
  type: string
): ActionFactoryResult<T> {
  // restricting config type to match createAction requirements
  // TODO: https://lifeready.atlassian.net/browse/LIFE-481
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAction(
    type,
    props<any>() as ActionCreatorProps<T> & NotAllowedCheck<T>
  );
}
