import {
  ActionCreator,
  createAction,
  createActionGroup,
  NotAllowedCheck,
  on,
  props,
  ReducerTypes,
} from '@ngrx/store';
import {
  Action,
  ActionCreatorProps,
  Creator,
  TypedAction,
} from '@ngrx/store/src/models';
import { catchError, of } from 'rxjs';
import {
  ErrorHandler,
  LoadingState,
  LoadingStates,
  WithLoadingStates,
} from './loading-state';
import { lodash } from './lodash';

type OnState<State> = State extends infer S ? S : never;

type LoadingActionsReducerTypes<State> = ReducerTypes<
  State,
  ActionCreator<string, Creator<any[], object>>[]
>;

export interface FailureAction {
  error?: any;
}

export interface LoadAction {
  // If there is existing data and the time since it was loaded does not exceed
  // the maxAge in milliseconds, then we can consider the value in the store valid. The loadingState.issueFetch
  // will be set to false in this case.
  maxAge?: number;
  // If true, any loading errors will not generate global error notifications.
  // Set this to true if your component wants to handle the error.
  // If there are multiple calls to dispatch load action, then if any of the
  // actions has localError == true, then the next failure action will be handled
  // locally and not show a global error.
  localError?: boolean;
}

export const init = Object.freeze({
  loading: false,
  success: false,
  issueFetch: false,
  errorHandler: ErrorHandler.INIT,
  successTimestamp: undefined,
  error: undefined,
} as const);

const shouldIssueFetch = (
  oldState: Readonly<LoadingState>,
  action: Readonly<LoadAction>
): boolean => {
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
};

const getErrorHandler = (
  oldState: Readonly<LoadingState>,
  action: Readonly<LoadAction>,
  issueFetch: boolean
): ErrorHandler => {
  // If loading or issuing API fetch, then there is guaranteed to be a success/failure
  // action that the global error handler might need to handle.
  if (oldState.loading || issueFetch) {
    // If any load action sets the localError to true, then it disables the global error hander
    // until the success/failure action is handled.
    if (action.localError) {
      return ErrorHandler.LOCAL;
    } else if (oldState.errorHandler == ErrorHandler.INIT) {
      // If it's in the INIT state, then we use the default global handler because the
      // loading action has not requests for localError handler.
      return ErrorHandler.GLOBAL;
    }
    // else just fall through and return the existing errorHandler unchanged.
  }

  return oldState.errorHandler;
};

function distinctState(
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
function actionFactory<T extends object>(type: string): ActionFactoryResult<T> {
  // restricting config type to match createAction requirements
  // TODO: https://lifeready.atlassian.net/browse/LIFE-481
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createAction(
    type,
    props<any>() as ActionCreatorProps<T> & NotAllowedCheck<T>
  );
}

export class LoadingActions<
  LoadPayloadType extends object,
  SuccessPayloadType extends object,
  FailurePayloadType extends object
> {
  readonly load: ActionFactoryResult<LoadAction & LoadPayloadType>;
  readonly success: ActionFactoryResult<SuccessPayloadType>;
  readonly failure: ActionFactoryResult<FailureAction & FailurePayloadType>;

  /**
   *
   * @param options.userId "undefined" means this is not a loading action parameterized by id.
   *   "true" means the user will directly set the id in the action.
   *   "function" can be provided to compute an id from the action payload.
   */
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

  instanceOfSuccess(
    action: Action
  ): action is ReturnType<ActionFactoryResult<SuccessPayloadType>> {
    return action.type === this.success.type;
  }

  instanceOfFailure(
    action: Action
  ): action is ReturnType<
    ActionFactoryResult<FailureAction & FailurePayloadType>
  > {
    return action.type === this.failure.type;
  }

  //   // TODO make these private
  //   /**
  //    * Returns the "loading" state
  //    * @param loadingStates List of existing loading states
  //    * @returns The "loading" state
  //    */
  //   getLoading(loadingStates: LoadingStates): boolean {
  //     this.checkNotUseId();
  //     return LoadingStatesManager.getLoading(loadingStates, this.getLoadingKey());
  //   }

  //   /**
  //    * Returns the "success" state
  //    * @param loadingStates List of existing loading states
  //    * @returns The "success" state
  //    */
  //   getSuccess(loadingStates: LoadingStates): boolean {
  //     this.checkNotUseId();
  //     return LoadingStatesManager.getSuccess(loadingStates, this.getLoadingKey());
  //   }

  //   /**
  //    * Returns the "error" state
  //    * @param loadingStates List of existing loading states
  //    * @returns The "error" state
  //    */
  //   getError(loadingStates: LoadingStates): LrError2 {
  //     this.checkNotUseId();
  //     return LoadingStatesManager.getError(loadingStates, this.getLoadingKey());
  //   }

  //   /**
  //    * Returns a map of selectors for loading, success, error, and the entire state.
  //    * The advantage of doing it in a bundle is that we can share the result of createStateSelector(),
  //    * if we separated into individual functions, each function might need to call createStateSelector()
  //    * to create a new instance of the selector. We can't cache any created selectors because will cause
  //    * memory leak since the cached references are always help in this class and hence does not get released.
  //    * @param selectLoadingStates Selector that returns the loadingStats of the feature slice. You can use createLoadingStatesSelector()
  //    *   to create it.
  //    * @returns A collection of selectors
  //    *   state: the LoadingState
  //    *   loading: True if loading
  //    *   success: True if last load was successful
  //    *   error: LrError2 object if previous loading failed.
  //    *
  //    */
  //   createSelectors(
  //     selectLoadingStates: MemoizedSelector<
  //       object,
  //       LoadingStates,
  //       DefaultProjectorFn<LoadingStates>
  //     >
  //   ): {
  //     state: MemoizedSelector<
  //       object,
  //       LoadingState,
  //       DefaultProjectorFn<LoadingState>
  //     >;
  //     loading: MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
  //     success: MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
  //     error: MemoizedSelector<object, LrError2, DefaultProjectorFn<LrError2>>;
  //   } {
  //     this.checkNotUseId();
  //     const state = createSelector(selectLoadingStates, (loadingStates) => {
  //       return LoadingStatesManager.getState(loadingStates, this.getLoadingKey());
  //     });

  //     const loading = createSelector(
  //       state,
  //       (loadingState) => loadingState.loading
  //     );
  //     const success = createSelector(
  //       state,
  //       (loadingState) => loadingState.success
  //     );
  //     const error = createSelector(state, (loadingState) => loadingState.error);

  //     return {
  //       state,
  //       loading,
  //       success,
  //       error,
  //     };
  //   }

  //   /**
  //    *
  //    * @param selectLoadingStates
  //    * @returns A collection of selectors
  //   *    ids: map id to LoadingState
  //    *   state: the LoadingState parameterized on the id
  //    *   loading: True if loading parameterized on the id
  //    *   success: True if last load was successful parameterized on the id
  //    *   error: LrError2 object if previous loading failed. parameterized on the id

  //    */
  //   createIdSelectors(
  //     selectLoadingStates: MemoizedSelector<
  //       object,
  //       LoadingStates,
  //       DefaultProjectorFn<LoadingStates>
  //     >
  //   ): {
  //     ids: MemoizedSelector<
  //       object,
  //       IdLoadingStateIds,
  //       DefaultProjectorFn<IdLoadingStateIds>
  //     >;
  //     state: (
  //       id: string
  //     ) => MemoizedSelector<
  //       object,
  //       LoadingState,
  //       DefaultProjectorFn<LoadingState>
  //     >;
  //     loading: (
  //       id: string
  //     ) => MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
  //     success: (
  //       id: string
  //     ) => MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
  //     error: (
  //       id: string
  //     ) => MemoizedSelector<object, LrError2, DefaultProjectorFn<LrError2>>;
  //   } {
  //     this.checkUseId();

  //     const ids = createSelector(selectLoadingStates, (loadingStates) => {
  //       return LoadingStatesManager.getIds(loadingStates, this.getLoadingKey());
  //     });

  //     const state = (
  //       id: string
  //     ): MemoizedSelector<
  //       object,
  //       LoadingState,
  //       DefaultProjectorFn<LoadingState>
  //     > => {
  //       return createSelector(ids, (ids) => {
  //         return ids[id];
  //       });
  //     };

  //     const loading = (
  //       id: string
  //     ): MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>> => {
  //       return createSelector(state(id), (loadingState) => {
  //         return loadingState.loading;
  //       });
  //     };

  //     const success = (
  //       id: string
  //     ): MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>> => {
  //       return createSelector(state(id), (loadingState) => {
  //         return loadingState.success;
  //       });
  //     };

  //     const error = (
  //       id: string
  //     ): MemoizedSelector<object, LrError2, DefaultProjectorFn<LrError2>> => {
  //       return createSelector(state(id), (loadingState) => {
  //         return loadingState.error;
  //       });
  //     };

  //     return {
  //       ids,
  //       state,
  //       loading,
  //       success,
  //       error,
  //     };
  //   }

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
  reducer<State extends WithLoadingStates>(options?: {
    onLoad?: (
      state: OnState<State>,
      action: LoadAction & LoadPayloadType & TypedAction<string>
    ) => State;
    onSuccess?: (
      state: OnState<State>,
      action: SuccessPayloadType & TypedAction<string>
    ) => State;
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
          loadingStates: this.setLoading(state.loadingStates, action),
        };

        // The updated loadingStates is passed to the user code for maximum
        // flexibility in case the user wishes to change the loadingStates.
        return (onLoad ? onLoad(newState, action) : newState) as OnState<State>;
      }),
      on(this.success, (state, action) => {
        const newState = {
          ...state,
          loadingStates: this.setSuccess(state.loadingStates),
        };

        return (
          onSuccess ? onSuccess(newState, action) : newState
        ) as OnState<State>;
      }),
      on(this.failure, (state, action) => {
        const newState = {
          ...state,
          loadingStates: this.setFailure(state.loadingStates, action),
        };

        return (
          onFailure ? onFailure(newState, action) : newState
        ) as OnState<State>;
      }),
    ];
  }

  catchError(): ReturnType<typeof catchError> {
    return catchError((error) => {
      return of(
        // AZ: Casting to "any" is less than ideal. But just can't figure out the complex typing here.
        this.failure({
          error,
        } as any)
      );
    });
  }

  //   idLoadHandler(
  //     fetch: (
  //       idActions$: Observable<
  //         LoadAction & LoadPayloadType & TypedAction<string>
  //       >,
  //       id: string
  //     ) => Observable<Action>
  //   ): UnaryFunction<Observable<Action>, Observable<Action>> {
  //     return pipe(ofType(this.load), (source): Observable<Action> => {
  //       // Below is inspired by: https://github.com/nrwl/nx/blob/master/packages/angular/src/runtime/nx/data-persistence.ts#L75
  //       const groupedFetches = source.pipe(
  //         groupBy((action) => {
  //           return action.id; // This will be used as the "group.key"
  //         })
  //       );
  //       return groupedFetches.pipe(
  //         mergeMap((group) => {
  //           return fetch(group, group.key).pipe(
  //             tap((action: TypedAction<string>) => {
  //               // If the action is success or failure, then fill in the id.
  //               if (
  //                 this.instanceOfSuccess(action) ||
  //                 this.instanceOfFailure(action)
  //               ) {
  //                 if (action.id === undefined) {
  //                   // Modifying the action in-place rather than returning a copy. Not certain which is better at the moment.
  //                   action.id = group.key;
  //                 } else if (action.id != group.key) {
  //                   throw new LrBadLogicException2(
  //                     "This is an id-based success/failure action, so you either omit the id parameter, or set it to the same as the load action's id. " +
  //                       `Load action id: ${group.key}, success/failure action id: ${action.id}`
  //                   );
  //                 }
  //               }
  //             })
  //           );
  //         })
  //       );
  //     });
  //   }

  // ----------------------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------------------
  private get key(): string {
    return this.load.type;
  }

  private setState(options: {
    loadingStates: Readonly<LoadingStates>;
    getNewState: (oldLoadingState: LoadingState) => Readonly<LoadingState>;
  }): Readonly<LoadingStates> {
    const { loadingStates, getNewState } = options;

    const oldState = loadingStates[this.key];
    const newState = getNewState(oldState);

    if (oldState !== newState) {
      // Return new reference only when the state has changed.
      return {
        ...loadingStates,
        [this.key]: newState,
      };
    } else {
      // No change in state, so no change in parent state.
      return loadingStates;
    }
  }

  /**
   * Set state to loading.
   * @param loadingStates List of existing loading states
   * @param action Loading action
   * @returns New loading state
   */
  private setLoading(
    loadingStates: LoadingStates,
    action: Action & LoadAction
  ): LoadingStates {
    const getNewState = (oldState: LoadingState) => {
      oldState = oldState ?? init;

      const issueFetch = shouldIssueFetch(oldState, action);

      const errorHandler = getErrorHandler(oldState, action, issueFetch);

      const newState: Readonly<LoadingState> = issueFetch
        ? {
            loading: true,
            success: false,
            issueFetch,
            errorHandler,
            successTimestamp: oldState.successTimestamp,
            error: undefined,
          }
        : {
            // Deliberately avoiding the use of the spread operator, i.e. no ...oldState
            // because we want to be 100% explicit about the states we are setting. Using ...oldState
            // makes it difficult to read. Being explicit means we need to specify all fields
            // from LoadingState. If we ever add more states to LoadingState the typing will catch any
            // missing states. There's also just the loading(), success(), failure() functions
            // so not too cumbersome to be explicit.
            loading: oldState.loading,
            success: oldState.success,
            issueFetch,
            errorHandler,
            successTimestamp: oldState.successTimestamp,
            error: oldState.error,
          };

      return distinctState(oldState, newState);
    };

    return this.setState({
      loadingStates,
      getNewState,
    });
  }

  /**
   * Set state to success.
   * @param loadingStates List of existing loading states
   * @returns New loading state
   */
  private setSuccess(loadingStates: LoadingStates): LoadingStates {
    const getNewState = (
      oldState: Readonly<LoadingState>
    ): Readonly<LoadingState> => {
      // Note that because success doesn't take in the current state, we can't use distinctState test.
      const newState: Readonly<LoadingState> = {
        loading: false,
        success: true,
        issueFetch: false,
        // each load action will set this again, so here we just set it back to default.
        errorHandler: ErrorHandler.INIT,
        successTimestamp: Date.now(),
        error: undefined,
      };

      return distinctState(oldState ?? init, newState);
    };

    return this.setState({
      loadingStates,
      getNewState,
    });
  }

  /**
   * Set state to failure.
   * @param loadingStates List of existing loading states
   * @param action Failure action
   * @returns New loading state
   */
  private setFailure(
    loadingStates: LoadingStates,
    action: Action & FailureAction
  ): LoadingStates {
    const getNewState = (oldState: LoadingState) => {
      oldState = oldState ?? init;

      const newState: Readonly<LoadingState> = {
        loading: false,
        success: false,
        issueFetch: false,
        // Leading this as is for the global error handler to check.
        errorHandler: oldState.errorHandler,
        successTimestamp: oldState.successTimestamp,
        error: action.error,
      };

      return distinctState(oldState, newState);
    };

    return this.setState({
      loadingStates,
      getNewState,
    });
  }
}

// These classes are basically serving the same purpose as props<T> in createAction() where it
// just holds the type and allows you to name the class to make it easier to read. The alternative
// is to  explicitly specify the type when calling createLoadingActions<...>(). But the template
// types are positional only, so not easy to read.
export class Load<_LoadPayloadType> {
  // These variables with constant string typing prevents Load and Success instances from being
  // assignable to each other.
  type: 'LOAD' = 'LOAD';
}
export class Success<_SuccessPayloadType> {
  type: 'SUCCESS' = 'SUCCESS';
}
export class Failure<_FailurePayloadType> {
  type: 'FAILURE' = 'FAILURE';
}

export type NoIntersection<A, B extends object> = {
  [K in keyof A]: K extends keyof B ? never : A[K];
};

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
    failure: actionFactory<FailureAction & FailurePayloadType>(
      `${actionTypePrefix} Failure`
    ),
  });
}
