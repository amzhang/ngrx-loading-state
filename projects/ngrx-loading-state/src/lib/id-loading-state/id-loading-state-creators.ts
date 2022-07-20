// These classes are basically serving the same purpose as props<T> in createAction() where it
// just holds the type and allows you to name the class to make it easier to read. The alternative
// is to  explicitly specify the type when calling createLoadingActions<...>(). But the template

import { createSelector, DefaultProjectorFn, MemoizedSelector } from '@ngrx/store';
import { actionFactory } from '../loading-state/loading-state-functions';
import { NoIntersection } from '../utils';
import { IdLoadingActions } from './id-loading-state-actions';
import {
  IdFailureAction,
  IdLoadAction,
  IdLoadingStates,
  IdSuccessAction,
  WithIdLoadingStatesOnly
} from './id-loading-state-types';

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

export function idLoad<
  LoadPayloadType extends NotIdLoadingAction<LoadPayloadType>
>(): IdLoad<LoadPayloadType> {
  return new IdLoad<LoadPayloadType>();
}

export function idSuccess<SuccessPayloadType>(): IdSuccess<SuccessPayloadType> {
  return new IdSuccess<SuccessPayloadType>();
}

export function idFailure<
  FailurePayloadType extends NotIdFailureAction<FailurePayloadType>
>(): IdFailure<FailurePayloadType> {
  return new IdFailure<FailurePayloadType>();
}

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
  return new IdLoadingActions({
    idLoad: actionFactory<IdLoadAction & LoadPayloadType>(`${actionTypePrefix}`),
    idSuccess: actionFactory<IdSuccessAction & SuccessPayloadType>(`${actionTypePrefix} Success`),
    idFailure: actionFactory<IdFailureAction & FailurePayloadType>(`${actionTypePrefix} Failure`)
  });
}

export function createIdLoadingStatesSelector<State extends WithIdLoadingStatesOnly>(
  featureSelector: MemoizedSelector<object, State, DefaultProjectorFn<State>>
): MemoizedSelector<object, IdLoadingStates, DefaultProjectorFn<IdLoadingStates>> {
  return createSelector(featureSelector, (state) => {
    return state.idLoadingStates;
  });
}
