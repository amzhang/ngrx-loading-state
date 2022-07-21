import { createSelector, DefaultProjectorFn, MemoizedSelector } from '@ngrx/store';
import { NoIntersection } from '../utils';
import { LoadingActions } from './loading-state-actions';
import { actionFactory } from './loading-state-functions';
import {
  FailureAction,
  LoadAction,
  LoadingStates,
  WithLoadingStatesOnly
} from './loading-state-types';

export function load<
  LoadPayloadType extends NotLoadingAction<LoadPayloadType>
>(): Load<LoadPayloadType> {
  return new Load<LoadPayloadType>();
}

export function success<SuccessPayloadType>(): Success<SuccessPayloadType> {
  return new Success<SuccessPayloadType>();
}

export function failure<
  FailurePayloadType extends NotFailureAction<FailurePayloadType>
>(): Failure<FailurePayloadType> {
  return new Failure<FailurePayloadType>();
}

/**
 * Creates a set of load, success, failure actions. Selectors and reducers are always bundled into
 * the same structure.
 *
 * @param type The "type" of the action.
 * @param _load See usage example
 * @param _success See usage example
 * @param _failure See usage example
 * @returns An instance of LoadingActions class that bundles together actions, selectors and reducers.
 * @example
 *  export const fetchItem = createLoadingActions(
 *    'Fetch Item',
 *    load<{ itemId: number }>(), // Action type is: 'Fetch Item'
 *    success<{ item: object }>(), // Action type is: 'Fetch Item Success'
 *    failure<{}>() // Action type is: 'Fetch Item Failure'
 *  );
 */
export function createLoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
>(
  type: string,
  _load: Load<LoadPayloadType>,
  _success: Success<SuccessPayloadType>,
  _failure: Failure<FailurePayloadType>
): LoadingActions<LoadPayloadType, SuccessPayloadType, FailurePayloadType> {
  return new LoadingActions({
    load: actionFactory<LoadAction & LoadPayloadType>(`${type}`),
    success: actionFactory<SuccessPayloadType>(`${type} Success`),
    failure: actionFactory<FailureAction & FailurePayloadType>(`${type} Failure`)
  });
}

/**
 *
 * @param featureSelector Selector that selects the current feature slice of the store.
 * @returns Selector that selects the loadingStates field from the store
 * @example
 *  // Using ngrx's createFeatureSelector to select the feature slice from global store.
 *  const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);
 *  const selectLoadingStates = createLoadingStatesSelector(selectState);
 *
 *  You can then use selectLoadingStates to compose other selectors. eg.
 *
 *  export const fetchItem = createLoadingActions(
 *    'Fetch Item',
 *    load<{ itemId: number }>(),
 *    success<{ item: object }>(),
 *    failure<{}>()
 *  );
 *
 *  export const fetchItemSelectors = fetchItem.createSelectors(selectLoadingStates);
 *
 */
export function createLoadingStatesSelector<State extends WithLoadingStatesOnly>(
  featureSelector: MemoizedSelector<object, State, DefaultProjectorFn<State>>
): MemoizedSelector<object, LoadingStates, DefaultProjectorFn<LoadingStates>> {
  return createSelector(featureSelector, (state) => {
    return state.loadingStates;
  });
}

// ------------------------------------------------------------------------
// Internal
// ------------------------------------------------------------------------

// These classes are basically serving the same purpose as props<T> in createAction() where it
// just holds the type and allows you to name the class to make it easier to read. The alternative
// is to  explicitly specify the type when calling createLoadingActions<...>(). But the template

// types are positional only, so not easy to read.
class Load<_LoadPayloadType> {
  // These variables with constant string typing prevents Load and Success instances from being
  // assignable to each other.
  type: 'LOAD' = 'LOAD';
}
class Success<_SuccessPayloadType> {
  type: 'SUCCESS' = 'SUCCESS';
}
class Failure<_FailurePayloadType> {
  type: 'FAILURE' = 'FAILURE';
}

// This ensures that we don't redefine the existing fields in the actions.
type NotLoadingAction<T> = NoIntersection<T, LoadAction>;
type NotFailureAction<T> = NoIntersection<T, FailureAction>;
