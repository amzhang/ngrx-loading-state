import { ActionReducer, MetaReducer } from '@ngrx/store';
import {
  FailureAction,
  FailureHandlerState,
  LoadingState
} from './loading-state/loading-state-types';
import { isArray, isPlainObject } from 'lodash';

export type FailureHandler = (failureAction: FailureAction, state: LoadingState) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfLoadingState(state: any): state is LoadingState {
  return (state as LoadingState)?.isLoadingState;
}

/**
 * Recursively process all fields of the states. When it encounters a LoadingStateBase object, it
 * will check if there are failures and needs global failure handling. If global handling is needed,
 * it shows a snackbar message, and changes the failureHandler to FailureHandlerState.INIT as a way to
 * mark the failure as having been processed.
 *
 */
function processState(options: {
  state: unknown;
  failureAction: FailureAction;
  failureHandler: FailureHandler;
}): void {
  const { state, failureAction, failureHandler } = options;

  if (instanceOfLoadingState(state)) {
    if (state.error && state.failureHandlerState == FailureHandlerState.GLOBAL) {
      // Passing back new reference from this reducer is not unnecessary since for each reducer pass
      // all unhandled global failures are handled and failureHandlerState set to FailureHandlerState.INIT to
      // mark it as having been processed.
      // No effects can fire in between the change from GLOBAL to INIT. And since
      // the loadingState must have changed in response to a failure, it's always a new reference
      // compared to the old state.
      state.failureHandlerState = FailureHandlerState.INIT;

      failureHandler(failureAction, state);
    }
  } else {
    if (isArray(state)) {
      // Recursively handle all sub fields. This includes LoadingStateTypes.ID_LOADING_STATE
      // As per previous comment, we are not creating new state references so editing in-place.
      state.forEach((field) =>
        processState({
          ...options,
          state: field
        })
      );
    } else if (isPlainObject(state)) {
      Object.values(state as object).forEach((field) =>
        processState({
          ...options,
          state: field
        })
      );
    }
  }
}

export function globalFailureReducerFactory(failureHandler: FailureHandler): MetaReducer {
  return (reducer: ActionReducer<any, any>): ActionReducer<any, any> => {
    return (state: any, action: any): any => {
      state = reducer(state, action);

      const failureAction = action as unknown as FailureAction;

      // We must ensure that only FailureAction has this field. But we can
      // easily change this field name to something more unique.
      if (failureAction.error) {
        processState({ state, failureHandler: failureHandler, failureAction });
      }

      return state;
    };
  };
}
