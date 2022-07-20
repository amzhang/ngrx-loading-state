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

export function createLoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
>(
  actionTypePrefix: string,
  _load: Load<LoadPayloadType>,
  _success: Success<SuccessPayloadType>,
  _failure: Failure<FailurePayloadType>
): LoadingActions<LoadPayloadType, SuccessPayloadType, FailurePayloadType> {
  return new LoadingActions({
    load: actionFactory<LoadAction & LoadPayloadType>(`${actionTypePrefix}`),
    success: actionFactory<SuccessPayloadType>(`${actionTypePrefix} Success`),
    failure: actionFactory<FailureAction & FailurePayloadType>(`${actionTypePrefix} Failure`)
  });
}

export function createLoadingStatesSelector<State extends WithLoadingStatesOnly>(
  featureSelector: MemoizedSelector<object, State, DefaultProjectorFn<State>>
): MemoizedSelector<object, LoadingStates, DefaultProjectorFn<LoadingStates>> {
  return createSelector(featureSelector, (state) => {
    return state.loadingStates;
  });
}
