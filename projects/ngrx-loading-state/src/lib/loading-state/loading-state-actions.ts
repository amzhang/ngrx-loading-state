import { createSelector, DefaultProjectorFn, MemoizedSelector, on } from '@ngrx/store';
import { Action, TypedAction } from '@ngrx/store/src/models';
import { catchError, of } from 'rxjs';
import {
  ActionFactoryResult,
  cloneLoadingStateBase,
  getNewFailureState,
  getNewLoadState,
  getNewSuccessState
} from './loading-state-functions';
import {
  FailureAction,
  INITIAL_LOADING_STATE,
  LoadAction,
  LoadingActionsReducerTypes,
  LoadingState,
  LoadingStateBase,
  LoadingStates,
  LOADING_STATE,
  OnState
} from './loading-state-types';

export class LoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
> {
  readonly load: ActionFactoryResult<LoadAction & LoadPayloadType>;
  readonly success: ActionFactoryResult<SuccessPayloadType>;
  readonly failure: ActionFactoryResult<FailureAction & FailurePayloadType>;

  constructor(options: {
    load: ActionFactoryResult<LoadAction & LoadPayloadType>;
    success: ActionFactoryResult<SuccessPayloadType>;
    failure: ActionFactoryResult<FailureAction & FailurePayloadType>;
  }) {
    // Could have used createActionGroup() but the string literal typing of Source is giving me trouble. For now,
    // just separate types.
    this.load = options.load;
    this.success = options.success;
    this.failure = options.failure;
  }

  // ----------------------------------------------------------------------------
  // Typing
  // ----------------------------------------------------------------------------
  instanceOfLoad(
    action: Action
  ): action is ReturnType<ActionFactoryResult<LoadAction & LoadPayloadType>> {
    return action.type === this.load.type;
  }

  instanceOfSuccess(action: Action): action is ReturnType<ActionFactoryResult<SuccessPayloadType>> {
    return action.type === this.success.type;
  }

  instanceOfFailure(
    action: Action
  ): action is ReturnType<ActionFactoryResult<FailureAction & FailurePayloadType>> {
    return action.type === this.failure.type;
  }
  // ------------------------------------------------------------------------------------------------
  // Reducer
  // ------------------------------------------------------------------------------------------------
  /**
   * Creates reducers for the load, success, failure actions.
   *
   * Usage:
   *   export const reducer = createReducer(
   *     initialState,
   *                                       // (2)
   *     ...VaultActions.fetchVaultId.reducer<VaultState>({
   *                                     // (1)
   *       onSuccess: (state, { vaultId }): VaultState => {
   *         return { ...state, vaultId };
   *       }
   *     }),
   *   );
   *
   * (1) We need this explicit return type because "return type widening" means that the
   * type constraints on the onSuccess function is only narrowing, so if you provide more
   * fields in the return object that is not in VaultState, there is no error. Because
   * the return value can be narrowed to the onSuccess function's constraints. So we have
   * to explicitly specify the return type here. This is a well known issue that has been
   * raise since at least 2016. So does not look like it will be fixed. Also, it's a recommended
   * pattern in ngrx reducers to have this explicit typing.
   *
   * Ref https://github.com/microsoft/TypeScript/issues/241#issuecomment-327269994
   *
   * (2): Given that there are explicity return types on the onLoad, onSuccess, onFailure functions
   * it should be possible to infer the type of the state here. But can't figure out how.
   *
   * @param options.onLoad On load action, should return a new copy of the state.
   * @param options.onSuccess On success action, should return a new copy of the state.
   * @param options.onFailure On failure action, should return a new copy of the state.
   * @returns A tuple of `on()` instances that handles load, success, failure actions in this order.
   */
  reducer<State extends { loadingStates: LoadingStates }>(options?: {
    onLoad?: (
      state: OnState<State>,
      action: LoadAction & LoadPayloadType & TypedAction<string>
    ) => State;
    onSuccess?: (state: OnState<State>, action: SuccessPayloadType & TypedAction<string>) => State;
    onFailure?: (
      state: OnState<State>,
      action: FailureAction & FailurePayloadType & TypedAction<string>
    ) => State;
  }): [
    LoadingActionsReducerTypes<State>,
    LoadingActionsReducerTypes<State>,
    LoadingActionsReducerTypes<State>
  ] {
    const { onLoad, onSuccess, onFailure } = options || {};
    return [
      on(this.load, (state, action) => {
        // Reducer must always create a new copy of the state.
        const newState = {
          ...state,
          loadingStates: this.setState(getNewLoadState, action, state.loadingStates)
        };

        // The updated loadingStates is passed to the user code for maximum
        // flexibility in case the user wishes to change the loadingStates.
        return (onLoad ? onLoad(newState, action) : newState) as OnState<State>;
      }),
      on(this.success, (state, action) => {
        const newState = {
          ...state,
          loadingStates: this.setState(getNewSuccessState, action, state.loadingStates)
        };

        return (onSuccess ? onSuccess(newState, action) : newState) as OnState<State>;
      }),
      on(this.failure, (state, action) => {
        const newState = {
          ...state,
          loadingStates: this.setState(getNewFailureState, action, state.loadingStates)
        };

        return (onFailure ? onFailure(newState, action) : newState) as OnState<State>;
      })
    ];
  }

  catchError(): ReturnType<typeof catchError> {
    return catchError((error) => {
      return of(
        // AZ: Casting to "any" is less than ideal. But just can't figure out the complex typing here.
        this.failure({
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
  createSelectors(
    selectLoadingStates: MemoizedSelector<object, LoadingStates, DefaultProjectorFn<LoadingStates>>
  ): {
    state: MemoizedSelector<object, LoadingState, DefaultProjectorFn<LoadingState>>;
    loading: MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
    success: MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
    error: MemoizedSelector<object, any, DefaultProjectorFn<any>>;
  } {
    const state = createSelector(selectLoadingStates, (loadingStates) => {
      return this.getLoadingState(loadingStates);
    });

    const loading = createSelector(state, (loadingState) => loadingState.loading);
    const success = createSelector(state, (loadingState) => loadingState.success);
    const error = createSelector(state, (loadingState) => loadingState.error);

    return {
      state,
      loading,
      success,
      error
    };
  }

  // ----------------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------------
  private get key(): string {
    return this.load.type;
  }

  private getLoadingState(loadingStates: Readonly<LoadingStates>): Readonly<LoadingState> {
    // We should not be modifying the state without going via the reducer, hence
    // returning the immutable "init" object.
    return loadingStates[this.key] || INITIAL_LOADING_STATE;
  }

  private setState(
    getNewState: (
      action: Action & LoadAction,
      oldLoadingState: Readonly<LoadingStateBase>
    ) => Readonly<LoadingStateBase> | null,
    action: Action & LoadAction,
    loadingStates: Readonly<LoadingStates>
  ): Readonly<LoadingStates> {
    const oldState = cloneLoadingStateBase(loadingStates[this.key] || INITIAL_LOADING_STATE);
    const newState = getNewState(action, oldState);

    if (newState) {
      // Return new reference only when the state has changed.
      return {
        ...loadingStates,
        [this.key]: {
          ...newState,
          type: LOADING_STATE
        }
      };
    } else {
      // No change in state, so no change in parent state.
      return loadingStates;
    }
  }
}