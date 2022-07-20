import { ActionReducer, MetaReducer } from '@ngrx/store';
import { ErrorHandlerState, FailureAction, LoadingState, LOADING_STATE } from './loading-state';
import { lodash } from './lodash';

export type ErrorHandler = (failureAction: FailureAction, state: LoadingState) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function instanceOfLoadingState(state: any): state is LoadingState {
  return state?.type == LOADING_STATE;
}

/**
 * Recursively process all fields of the states. When it encounters a LoadingState object, it
 * will check if there are errors and needs global error handling. If global handling is needed,
 * it shows a snackbar message, and changes the errorHandler to LoadingErrorHandler.INIT as a way to
 * mark the error as having been processed.
 *
 */
function processState(options: {
  state: unknown;
  failureAction: FailureAction;
  errorHandler: ErrorHandler;
}): void {
  const { state, failureAction, errorHandler } = options;

  if (instanceOfLoadingState(state)) {
    if (state.error && state.errorHandlerState == ErrorHandlerState.GLOBAL) {
      // Passing back new reference from this reducer is not unnecessary since for each reducer pass
      // all unhandled global errors are handled and errorHandlerState set to ErrorHandlerState.INIT to
      // mark it as having been processed.
      // No effects can fire in between the change from GLOBAL to INIT. And since
      // the loadingState must have changed in response to an error, it's always a new reference
      // compared to the old state.
      state.errorHandlerState = ErrorHandlerState.INIT;

      errorHandler(failureAction, state);
    }
  } else {
    if (lodash.isArray(state)) {
      // Recursively handle all sub fields. This includes LoadingStateTypes.ID_LOADING_STATE
      // As per previous comment, we are not creating new state references so editing in-place.
      state.forEach((field) =>
        processState({
          ...options,
          state: field
        })
      );
    } else if (lodash.isPlainObject(state)) {
      Object.values(state as object).forEach((field) =>
        processState({
          ...options,
          state: field
        })
      );
    }
  }
}

export function globalErrorReducerFactory(errorHandler: ErrorHandler): MetaReducer {
  return (reducer: ActionReducer<any, any>): ActionReducer<any, any> => {
    return (state: any, action: any): any => {
      state = reducer(state, action);

      const failureAction = action as unknown as FailureAction;

      // We must ensure that only FailureAction has this field. But we can
      // easily change this field name to something more unique.
      if (failureAction.error) {
        processState({ state, errorHandler, failureAction });
      }

      return state;
    };
  };
}
