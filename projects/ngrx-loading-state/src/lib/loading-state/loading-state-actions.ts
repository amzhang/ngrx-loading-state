import { createSelector, DefaultProjectorFn, MemoizedSelector, on } from '@ngrx/store';
import { Action, TypedAction } from '@ngrx/store/src/models';
import { catchError, of } from 'rxjs';
import {
  cloneLoadingState,
  getNewFailureState,
  getNewLoadState,
  getNewSuccessState
} from './loading-state-functions';
import {
  ActionFactoryResult,
  FailureAction,
  LoadAction,
  LoadingActionsReducerTypes,
  LoadingState,
  LoadingStates,
  OnState
} from './loading-state-types';

/**
 * This class bundles up a set of load, success, and failure actions. It contains helpers to create
 * reducers for these actions and helpers for creating selectors.
 *
 * Do not use this class directly, use the createLoadingActions() helper function.
 *
 */
export class LoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
> {
  /** The actions the user can dispatch */
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
  /**
   * Type guard to test if action is of type LoadingActions.load.
   *
   * @param action Any ngrx action
   * @returns True if action if of type LoadingActions.load
   */
  instanceOfLoad(
    action: Action
  ): action is ReturnType<ActionFactoryResult<LoadAction & LoadPayloadType>> {
    return action.type === this.load.type;
  }

  /**
   * Type guard to test if action is of type LoadingActions.success.
   *
   * @param action Any ngrx action
   * @returns True if action if of type LoadingActions.success
   */
  instanceOfSuccess(action: Action): action is ReturnType<ActionFactoryResult<SuccessPayloadType>> {
    return action.type === this.success.type;
  }

  /**
   * Type guard to test if action is of type LoadingActions.failure.
   *
   * @param action Any ngrx action
   * @returns True if action if of type LoadingActions.failure
   */
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
   * @param options.onLoad Call back when action is LoadAction. Return new copy of state if state needs to change.
   * @param options.onSuccess Call back when action is SuccessAction. Return new copy of state if state needs to change.
   * @param options.onFailure Call back when action is FailureAction. Return new copy of state if state needs to change.
   * @returns A tuple of "on()" instances that handles load, success, failure actions in this order.
   * @example
   *   export const reducer = createReducer(
   *     initialState,
   *                    // Note: (1)
   *     ...fetchItem.reducer<ItemState>({
   *       onSuccess: (state, { item }): ItemState => {
   *         return { ...state, item };
   *       },
   *       // You can also customise what happens for LoadAction and FailureAction through onLoad and onFailure.
   *       // But most of the time, there's nothing to do for those. They are automatically handled by the fetchItem.reducer
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

  /**
   * Catches errors in effect.
   *
   * @returns rxjs operator that emits a FailureAction.
   * @example
   *
   *  fetchCount$ = createEffect(() => {
   *    return this.actions$.pipe(
   *      ofType(fetchCount.load),
   *      filterLoading(this.store.select(fetchCountSelectors.state)),
   *      switchMap((action) => {
   *        return apiCAll().pipe(
   *          map(item => fetchCount.success(item)),
   *          fetchCount.catchError()
   *        );
   *      })
   *    );
   *  });
   *
   */
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
   * Returns a map of selectors for loading, success, error, and the entire loading state. Similar to the ngrx entities adaptor.
   *
   * Design: The advantage of doing it in a bundle is that we can share the result of createStateSelector().
   * If we had separate individual functions, each function might need to call createStateSelector()
   * to create a new instance of the selector. We can't cache any created selectors because that will cause
   * a memory leak since the cached references are always held in this class and hence does not get released.
   *
   * @param selectLoadingStates Selector that returns the loadingStats of the feature slice. You can use createLoadingStatesSelector()
   *   to create it.
   * @returns A collection of selectors
   *   state: the LoadingState
   *   loading: True if loading
   *   success: True if last load was successful
   *   error: any errors from the last API call.
   * @example
   *  // The feature slice selector. Standard ngrx stuff.
   *  const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);
   *
   *  // Selector that selects the loadingStates field from the global store. The createLoadingStatesSelector()
   *  // is provided as a part of this lib as well.
   *  const selectLoadingStates = createLoadingStatesSelector(selectState);
   *
   *  // Create the selectors related to the fetchItem loading state.
   *  export const fetchItemSelectors = fetchItem.createSelectors(selectLoadingStates);
   *
   *  // You can then observe the loading states:
   *  this.store.select(fetchItemSelectors.state); // The entire LoadingState
   *  this.store.select(fetchItemSelectors.success); // The boolean success flag
   *  this.store.select(fetchItemSelectors.loading); // The boolean loading flag
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
    return loadingStates[this.key];
  }

  private setState(
    getNewState: (
      action: Action & LoadAction,
      oldLoadingState: Readonly<LoadingState>
    ) => Readonly<LoadingState> | null,
    action: Action & LoadAction,
    loadingStates: Readonly<LoadingStates>
  ): Readonly<LoadingStates> {
    // We work with LoadingStateBase here to be generic. The idLoadingActions also
    // use these functions.
    const currentState = cloneLoadingState(this.getLoadingState(loadingStates));
    const newState = getNewState(action, currentState);

    if (newState) {
      // Return new reference only when the state has changed.
      return {
        ...loadingStates,
        [this.key]: {
          ...newState
        }
      };
    } else {
      // No change in state, so no change in parent state.
      return loadingStates;
    }
  }
}
