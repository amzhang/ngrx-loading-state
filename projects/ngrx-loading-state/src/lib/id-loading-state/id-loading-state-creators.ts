// These classes are basically serving the same purpose as props<T> in createAction() where it
// just holds the type and allows you to name the class to make it easier to read. The alternative
// is to  explicitly specify the type when calling createLoadingActions<...>(). But the template

import { createAction, createSelector, DefaultProjectorFn, MemoizedSelector } from '@ngrx/store';
import { actionFactory } from '../loading-state/loading-state-functions';
import { createGetterSetter, NoIntersection } from '../utils';
import { IdLoadingActions } from './id-loading-state-actions';
import {
  IdFailureAction,
  IdLoadAction,
  IdLoadingStates,
  IdSuccessAction,
  WithIdLoadingStatesOnly
} from './id-loading-state-types';

export function idLoad<
  LoadPayloadType extends NotIdLoadingAction<LoadPayloadType>
>(): IdLoad<LoadPayloadType> {
  return new IdLoad<LoadPayloadType>();
}

export function idSuccess<
  SuccessPayloadType extends NotIdSuccessAction<SuccessPayloadType>
>(): IdSuccess<SuccessPayloadType> {
  return new IdSuccess<SuccessPayloadType>();
}

export function idFailure<
  FailurePayloadType extends NotIdFailureAction<FailurePayloadType>
>(): IdFailure<FailurePayloadType> {
  return new IdFailure<FailurePayloadType>();
}

/**
 * Creates a set of IdLoadAction, IdSuccessAction, and IdFailureAction. Selectors and reducers are always bundled into
 * the same structure.
 *
 * The difference between IdLoadAction and LoadAction is that IdLoadAction is parameterized by an id field. So you can
 * display loading states for multiple items that are all loading in parallel. Typical use case is you have a list of items,
 * and you can issue load actions for each one, parameterized by an id of your own choosing, and observe the loading state
 * of each item, again parameterized by the id.
 *
 * @param type The "type" of the action.
 * @param _idLoad See usage example
 * @param _idSuccess See usage example
 * @param _idFailure See usage example
 * @returns An instance of LoadingActions class that bundles together actions, selectors and reducers.
 * @example
 *  export const fetchItem = createIdLoadingActions(
 *    'Fetch Item',
 *    // An id field is already included in each of LoadAction, SuccessAction, FailureAction
 *    load<{}>(),
 *    success<{ item: object }>(),
 *    failure<{}>()
 *  );
 *
 *  // Dispatch load action
 *  const id = "123";
 *  this.store.dispatch(fetchItem.idLoad({ id }));
 *
 *  // Using ngrx's createFeatureSelector to select the feature slice from global store.
 *  const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);
 *  const selectLoadingStates = createLoadingStatesSelector(selectState);
 *
 *  const fetchItemSelectors = fetchItem.createIdSelectors(selectLoadingStates);
 *
 *  // Observe the loading state.
 *  this.store.select(fetchItemSelectors.state(id));
 *
 */
export function createIdLoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
>(
  actionTypePrefix: string,
  _idLoad: IdLoad<LoadPayloadType>,
  _idSuccess: IdSuccess<SuccessPayloadType>,
  _idFailure: IdFailure<FailurePayloadType>
): IdLoadingActions<LoadPayloadType, SuccessPayloadType, FailurePayloadType> {
  const idLoad = createAction(`${actionTypePrefix}`, (props) => ({
    ...props,
    // We must create the extract variable here because action objects are frozen.
    issueFetch: createGetterSetter<boolean | null>(null)
  }));

  return new IdLoadingActions({
    idLoad,
    idSuccess: actionFactory<IdSuccessAction & SuccessPayloadType>(`${actionTypePrefix} Success`),
    idFailure: actionFactory<IdFailureAction & FailurePayloadType>(`${actionTypePrefix} Failure`)
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
 *  export const fetchItem = createIdLoadingActions(
 *    'Fetch Item',
 *    load<{}>(),
 *    success<{ item: object }>(),
 *    failure<{}>()
 *  );
 *
 *  export const fetchItemSelectors = fetchItem.createSelectors(selectLoadingStates);
 *
 */
export function createIdLoadingStatesSelector<State extends WithIdLoadingStatesOnly>(
  featureSelector: MemoizedSelector<object, State, DefaultProjectorFn<State>>
): MemoizedSelector<object, IdLoadingStates, DefaultProjectorFn<IdLoadingStates>> {
  return createSelector(featureSelector, (state) => {
    return state.idLoadingStates;
  });
}

// ------------------------------------------------------------------------
// Internal
// ------------------------------------------------------------------------

// types are positional only, so not easy to read.
class IdLoad<_LoadPayloadType> {
  // These variables with constant string typing prevents Load and Success instances from being
  // assignable to each other.
  type: 'ID_LOAD' = 'ID_LOAD';
}
class IdSuccess<_SuccessPayloadType> {
  type: 'ID_SUCCESS' = 'ID_SUCCESS';
}
class IdFailure<_FailurePayloadType> {
  type: 'ID_FAILURE' = 'ID_FAILURE';
}

// This ensures that we don't redefine the existing fields in the actions.
type NotIdLoadingAction<T> = NoIntersection<T, IdLoadAction>;
type NotIdSuccessAction<T> = NoIntersection<T, IdSuccessAction>;
type NotIdFailureAction<T> = NoIntersection<T, IdFailureAction>;
