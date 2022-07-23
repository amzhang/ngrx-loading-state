import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, createSelector, DefaultProjectorFn, MemoizedSelector, on } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { catchError, groupBy, mergeMap, Observable, of, pipe, UnaryFunction } from 'rxjs';
import {
  cloneLoadingState,
  combineLoadingStates,
  getNewFailureState,
  getNewLoadState,
  getNewSuccessState
} from '../loading-state/loading-state-functions';
import {
  ActionFactoryResult,
  LoadingActionsReducerTypes,
  LoadingState,
  OnState
} from '../loading-state/loading-state-types';
import {
  Id,
  IdFailureAction,
  IdLoadAction,
  IdLoadingState,
  IdLoadingStateMap,
  IdLoadingStates,
  IdSuccessAction,
  WithIdLoadingStatesOnly
} from './id-loading-state-types';

/**
 * IdLoadingAction is similar to LoadingAction with the difference that it's parameterized on a user provided ID.
 *
 */
export class IdLoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
> {
  readonly idLoad: ActionFactoryResult<IdLoadAction & LoadPayloadType>;
  readonly idSuccess: ActionFactoryResult<IdSuccessAction & SuccessPayloadType>;
  readonly idFailure: ActionFactoryResult<IdFailureAction & FailurePayloadType>;

  constructor(options: {
    idLoad: ActionFactoryResult<IdLoadAction & LoadPayloadType>;
    idSuccess: ActionFactoryResult<IdSuccessAction & SuccessPayloadType>;
    idFailure: ActionFactoryResult<IdFailureAction & FailurePayloadType>;
  }) {
    // Could have used createActionGroup() but the string literal typing of Source is giving me trouble. For now,
    // just separate types.
    this.idLoad = options.idLoad;
    this.idSuccess = options.idSuccess;
    this.idFailure = options.idFailure;
  }

  // ----------------------------------------------------------------------------
  // Typing
  // ----------------------------------------------------------------------------
  instanceOfIdLoad(
    action: Action
  ): action is ReturnType<ActionFactoryResult<IdLoadAction & LoadPayloadType>> {
    return action.type === this.idLoad.type;
  }

  instanceOfIdSuccess(
    action: Action
  ): action is ReturnType<ActionFactoryResult<IdSuccessAction & SuccessPayloadType>> {
    return action.type === this.idSuccess.type;
  }

  instanceOfIdFailure(
    action: Action
  ): action is ReturnType<ActionFactoryResult<IdFailureAction & FailurePayloadType>> {
    return action.type === this.idFailure.type;
  }

  // ------------------------------------------------------------------------------------------------
  // Reducer
  // ------------------------------------------------------------------------------------------------
  reducer<State extends WithIdLoadingStatesOnly>(options?: {
    onLoad?: (
      state: OnState<State>,
      action: IdLoadAction & LoadPayloadType & TypedAction<string>
    ) => State;
    onSuccess?: (
      state: OnState<State>,
      action: IdSuccessAction & SuccessPayloadType & TypedAction<string>
    ) => State;
    onFailure?: (
      state: OnState<State>,
      action: IdFailureAction & FailurePayloadType & TypedAction<string>
    ) => State;
  }): [
    LoadingActionsReducerTypes<State>,
    LoadingActionsReducerTypes<State>,
    LoadingActionsReducerTypes<State>
  ] {
    const { onLoad, onSuccess, onFailure } = options || {};
    return [
      on(this.idLoad, (state, action) => {
        // Reducer must always create a new copy of the state.
        const newState = {
          ...state,
          idLoadingStates: this.setState(getNewLoadState, action, state.idLoadingStates)
        };

        // The updated loadingStates is passed to the user code for maximum
        // flexibility in case the user wishes to change the loadingStates.
        return (onLoad ? onLoad(newState, action) : newState) as OnState<State>;
      }),
      on(this.idSuccess, (state, action) => {
        const newState = {
          ...state,
          idLoadingStates: this.setState(getNewSuccessState, action, state.idLoadingStates)
        };

        return (onSuccess ? onSuccess(newState, action) : newState) as OnState<State>;
      }),
      on(this.idFailure, (state, action) => {
        const newState = {
          ...state,
          idLoadingStates: this.setState(getNewFailureState, action, state.idLoadingStates)
        };

        return (onFailure ? onFailure(newState, action) : newState) as OnState<State>;
      })
    ];
  }

  catchError(id: Id): ReturnType<typeof catchError> {
    return catchError((error) => {
      return of(
        // AZ: Casting to "any" is less than ideal. But just can't figure out the complex typing here.
        this.idFailure({
          id,
          error
        } as any)
      );
    });
  }

  // ----------------------------------------------------------------------------
  // Selectors
  // ----------------------------------------------------------------------------
  /**
   * Returns a map of selectors for loading, success, error, and the entire state.
   * The advantage of doing it in a bundle is that we can share the result of createStateSelector(),
   * if we separated into individual functions, each function might need to call createStateSelector()
   * to create a new instance of the selector. We can't cache any created selectors because will cause
   * memory leak since the cached references are always help in this class and hence does not get released.
   * @param selectLoadingStates Selector that returns the loadingStats of the feature slice. You can use createLoadingStatesSelector()
   *   to create it.
   * @returns A collection of selectors
   *   state: the LoadingState
   *   loading: True if loading
   *   success: True if last load was successful
   *   error: LrError2 object if previous loading failed.
   *
   */
  createIdSelectors(
    selectIdLoadingStates: MemoizedSelector<
      object,
      IdLoadingStates,
      DefaultProjectorFn<IdLoadingStates>
    >
  ): {
    state: (id: Id) => MemoizedSelector<object, IdLoadingState, DefaultProjectorFn<IdLoadingState>>;
    loading: (id: Id) => MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
    success: (id: Id) => MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
    error: (id: Id) => MemoizedSelector<object, any, DefaultProjectorFn<any>>;
    combinedState: MemoizedSelector<object, any, DefaultProjectorFn<any>>;
  } {
    const selectIdLoadingStateMap = createSelector(
      selectIdLoadingStates,
      (idLoadingStates) => idLoadingStates[this.key]
    );

    const state = (
      id: Id
    ): MemoizedSelector<object, IdLoadingState, DefaultProjectorFn<IdLoadingState>> => {
      return createSelector(selectIdLoadingStateMap, (idLoadingStateMap) =>
        this.getIdLoadingState(idLoadingStateMap, id)
      );
    };

    const loading = (id: Id) => {
      return createSelector(state(id), (idLoadingState) => idLoadingState.loading);
    };
    const success = (id: Id) => {
      return createSelector(state(id), (idLoadingState) => idLoadingState.success);
    };
    const error = (id: Id) => {
      return createSelector(state(id), (idLoadingState) => idLoadingState.error);
    };

    const combinedState = createSelector(selectIdLoadingStateMap, (idLoadingStateMap) => {
      return combineLoadingStates(idLoadingStateMap ? Object.values(idLoadingStateMap) : []);
    });

    return {
      state,
      loading,
      success,
      error,
      combinedState
    };
  }

  // ----------------------------------------------------------------------------
  // Effects
  // ----------------------------------------------------------------------------
  idLoadHandler(
    fetch: (
      idActions$: Observable<IdLoadAction & LoadPayloadType & TypedAction<string>>,
      id: Id
    ) => Observable<Action>
  ): UnaryFunction<Observable<Action>, Observable<Action>> {
    return pipe(ofType(this.idLoad), (source): Observable<Action> => {
      // Below is inspired by: https://github.com/nrwl/nx/blob/master/packages/angular/src/runtime/nx/data-persistence.ts#L75
      const groupedFetches = source.pipe(
        groupBy((action) => {
          return action.id; // This will be used as the "group.key"
        })
      );
      return groupedFetches.pipe(
        mergeMap((group) => {
          return fetch(group, group.key);
        })
      );
    });
  }

  createEffect(
    actions$: Actions,
    fetch: (
      idActions$: Observable<IdLoadAction & LoadPayloadType & TypedAction<string>>,
      id: Id
    ) => Observable<Action>
  ) {
    return createEffect(() => {
      return actions$.pipe(this.idLoadHandler(fetch));
    });
  }

  // ----------------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------------
  private get key(): string {
    return this.idLoad.type;
  }

  private getIdLoadingState(
    idLoadingStateMap: Readonly<IdLoadingStateMap>,
    id: Id
  ): Readonly<IdLoadingState> {
    if (id == null || id === '') {
      throw new Error('id parameter is null or empty string, this is almost always a logic bug.');
    }
    // We should not be modifying the state without going via the reducer, hence
    // returning the immutable "init" object.
    return idLoadingStateMap?.[id];
  }

  private setState(
    getNewState: (
      action: Action & (IdLoadAction | IdSuccessAction | IdFailureAction),
      oldLoadingState: Readonly<LoadingState>
    ) => Readonly<LoadingState> | null,
    action: Action & (IdLoadAction | IdSuccessAction | IdFailureAction),
    idLoadingStates: Readonly<IdLoadingStates>
  ): Readonly<IdLoadingStates> {
    const currentState = cloneLoadingState(idLoadingStates[this.key]?.[action.id]);
    const newState = getNewState(action, currentState);

    if (newState) {
      // Return new reference only when the state has changed.
      return {
        ...idLoadingStates,
        [this.key]: {
          ...idLoadingStates[this.key],
          [action.id]: { ...newState, isIdLoadingState: true, id: action.id }
        }
      };
    } else {
      // No change in state, so no change in parent state.
      return idLoadingStates;
    }
  }
}
