// import { createSelector, DefaultProjectorFn, MemoizedSelector, on } from '@ngrx/store';
// import { Action, TypedAction } from '@ngrx/store/src/models';
// import { catchError, of } from 'rxjs';
// import {
//   Id,
//   IdFailureAction,
//   IdLoadAction,
//   IdLoadingState,
//   IdSuccessAction,
//   ID_LOADING_STATE,
//   INITIAL_ID_LOADING_STATE
// } from './id-loading-state';
// import {
//   ErrorHandlerState,
//   FailureAction,
//   LoadAction,
//   LoadingState,
//   LOADING_STATE
// } from './loading-state';
// import {
//   ActionFactoryResult,
//   distinctState,
//   getErrorHandler,
//   shouldIssueFetch
// } from './loading-state-functions';
// import {
//   IdLoadingStates,
//   INITIAL_LOADING_STATE,
//   LoadingActionsReducerTypes,
//   LoadingStates,
//   WithLoadingStates
// } from './loading-state-types';
// import { OnState } from './utils';

// // export class LoadingActionsBase<
// //   SuccessPayloadType extends object,
// //   FailurePayloadType extends object
// // > {
// //   readonly success: ActionFactoryResult<SuccessPayloadType>;
// //   readonly failure: ActionFactoryResult<FailureAction & FailurePayloadType>;

// //   constructor(options: {
// //     success: ActionFactoryResult<SuccessPayloadType>;
// //     failure: ActionFactoryResult<FailureAction & FailurePayloadType>;
// //   }) {
// //     // Could have used createActionGroup() but the string literal typing of Source is giving me trouble. For now,
// //     // just separate types.
// //     this.success = options.success;
// //     this.failure = options.failure;
// //   }
// // }

// export class IdLoadingActions<
//   LoadPayloadType extends object,
//   SuccessPayloadType extends object,
//   FailurePayloadType extends object
// > {
//   readonly idLoad: ActionFactoryResult<IdLoadAction & LoadPayloadType>;
//   readonly idSuccess: ActionFactoryResult<IdSuccessAction & SuccessPayloadType>;
//   readonly idFailure: ActionFactoryResult<IdFailureAction & FailurePayloadType>;

//   constructor(options: {
//     idLoad: ActionFactoryResult<IdLoadAction & LoadPayloadType>;
//     success: ActionFactoryResult<IdSuccessAction & SuccessPayloadType>;
//     failure: ActionFactoryResult<IdFailureAction & FailurePayloadType>;
//   }) {
//     // Could have used createActionGroup() but the string literal typing of Source is giving me trouble. For now,
//     // just separate types.
//     this.idLoad = options.idLoad;
//     this.idSuccess = options.success;
//     this.idFailure = options.failure;
//   }

//   // ----------------------------------------------------------------------------
//   // Typing
//   // ----------------------------------------------------------------------------
//   instanceOfIdLoad(
//     action: Action
//   ): action is ReturnType<ActionFactoryResult<IdLoadAction & LoadPayloadType>> {
//     return action.type === this.idLoad.type;
//   }

//   instanceOfIdSuccess(
//     action: Action
//   ): action is ReturnType<ActionFactoryResult<SuccessPayloadType>> {
//     return action.type === this.idSuccess.type;
//   }

//   instanceOfIdFailure(
//     action: Action
//   ): action is ReturnType<ActionFactoryResult<FailureAction & FailurePayloadType>> {
//     return action.type === this.idFailure.type;
//   }

//   // ------------------------------------------------------------------------------------------------
//   // Reducer
//   // ------------------------------------------------------------------------------------------------
//   reducer<State extends WithLoadingStates>(options?: {
//     onLoad?: (
//       state: OnState<State>,
//       action: LoadAction & LoadPayloadType & TypedAction<string>
//     ) => State;
//     onSuccess?: (state: OnState<State>, action: SuccessPayloadType & TypedAction<string>) => State;
//     onFailure?: (
//       state: OnState<State>,
//       action: FailureAction & FailurePayloadType & TypedAction<string>
//     ) => State;
//   }): [
//     LoadingActionsReducerTypes<State>,
//     LoadingActionsReducerTypes<State>,
//     LoadingActionsReducerTypes<State>
//   ] {
//     const { onLoad, onSuccess, onFailure } = options || {};
//     return [
//       on(this.idLoad, (state, action) => {
//         // Reducer must always create a new copy of the state.
//         const newState = {
//           ...state,
//           loadingStates: this.setLoading(state.loadingStates, action)
//         };

//         // The updated loadingStates is passed to the user code for maximum
//         // flexibility in case the user wishes to change the loadingStates.
//         return (onLoad ? onLoad(newState, action) : newState) as OnState<State>;
//       }),
//       on(this.success, (state, action) => {
//         const newState = {
//           ...state,
//           loadingStates: this.setSuccess(state.loadingStates)
//         };

//         return (onSuccess ? onSuccess(newState, action) : newState) as OnState<State>;
//       }),
//       on(this.failure, (state, action) => {
//         const newState = {
//           ...state,
//           loadingStates: this.setFailure(state.loadingStates, action)
//         };

//         return (onFailure ? onFailure(newState, action) : newState) as OnState<State>;
//       })
//     ];
//   }

//   catchError(): ReturnType<typeof catchError> {
//     return catchError((error) => {
//       return of(
//         // AZ: Casting to "any" is less than ideal. But just can't figure out the complex typing here.
//         this.failure({
//           error
//         } as any)
//       );
//     });
//   }

//   // ----------------------------------------------------------------------------
//   // Selectors
//   // ----------------------------------------------------------------------------
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
//     selectLoadingStates: MemoizedSelector<object, LoadingStates, DefaultProjectorFn<LoadingStates>>
//   ): {
//     state: MemoizedSelector<object, LoadingState, DefaultProjectorFn<LoadingState>>;
//     loading: MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
//     success: MemoizedSelector<object, boolean, DefaultProjectorFn<boolean>>;
//     error: MemoizedSelector<object, any, DefaultProjectorFn<any>>;
//   } {
//     const state = createSelector(selectLoadingStates, (loadingStates) => {
//       return this.getLoadingState(loadingStates);
//     });

//     const loading = createSelector(state, (loadingState) => loadingState.loading);
//     const success = createSelector(state, (loadingState) => loadingState.success);
//     const error = createSelector(state, (loadingState) => loadingState.error);

//     return {
//       state,
//       loading,
//       success,
//       error
//     };
//   }

//   // ----------------------------------------------------------------------------
//   // Helpers
//   // ----------------------------------------------------------------------------
//   private get key(): string {
//     return this.load.type;
//   }

//   private getLoadingState(loadingStates: LoadingStates): LoadingState {
//     // We should not be modifying the state without going via the reducer, hence
//     // returning the immutable "init" object.
//     return loadingStates[this.key] || INITIAL_LOADING_STATE;
//   }

//   private setState(options: {
//     id: Id;
//     idLoadingStates: Readonly<IdLoadingStates>;
//     getNewState: (oldState: IdLoadingState) => Readonly<IdLoadingState>;
//   }): Readonly<IdLoadingStates> {
//     const { id, idLoadingStates, getNewState } = options;

//     const oldState = idLoadingStates[this.key]?.[id];
//     const newState = getNewState(oldState);

//     if (oldState !== newState) {
//       // Return new reference only when the state has changed.
//       return {
//         ...idLoadingStates,
//         [this.key]: {
//           ...idLoadingStates[this.key],
//           [id]: newState
//         }
//       };
//     } else {
//       // No change in state, so no change in parent state.
//       return idLoadingStates;
//     }
//   }

//   /**
//    * Set state to loading.
//    * @param loadingStates List of existing loading states
//    * @param action Loading action
//    * @returns New loading state
//    */
//   private setLoading(
//     idLoadingStates: IdLoadingStates,
//     action: Action & IdLoadAction
//   ): IdLoadingStates {
//     const getNewState = (oldState: IdLoadingState) => {
//       oldState = oldState ?? INITIAL_ID_LOADING_STATE;

//       const issueFetch = shouldIssueFetch(oldState, action);

//       const errorHandlerState = getErrorHandler(oldState, action, issueFetch);

//       const newState: Readonly<IdLoadingState> = issueFetch
//         ? {
//             type: ID_LOADING_STATE,
//             loading: true,
//             success: false,
//             issueFetch,
//             errorHandlerState,
//             successTimestamp: oldState.successTimestamp,
//             error: undefined,
//             id: action.id
//           }
//         : {
//             type: ID_LOADING_STATE,
//             // Deliberately avoiding the use of the spread operator, i.e. no ...oldState
//             // because we want to be 100% explicit about the states we are setting. Using ...oldState
//             // makes it difficult to read. Being explicit means we need to specify all fields
//             // from LoadingState. If we ever add more states to LoadingState the typing will catch any
//             // missing states. There's also just the loading(), success(), failure() functions
//             // so not too cumbersome to be explicit.
//             loading: oldState.loading,
//             success: oldState.success,
//             issueFetch,
//             errorHandlerState,
//             successTimestamp: oldState.successTimestamp,
//             error: oldState.error,
//             id: action.id
//           };

//       return distinctState(oldState, newState);
//     };

//     return this.setState({
//       id: action.id,
//       idLoadingStates,
//       getNewState
//     });
//   }

//   /**
//    * Set state to success.
//    * @param loadingStates List of existing loading states
//    * @returns New loading state
//    */
//   private setSuccess(loadingStates: LoadingStates): LoadingStates {
//     const getNewState = (oldState: Readonly<LoadingState>): Readonly<LoadingState> => {
//       // Note that because success doesn't take in the current state, we can't use distinctState test.
//       const newState: Readonly<LoadingState> = {
//         type: LOADING_STATE,
//         loading: false,
//         success: true,
//         issueFetch: false,
//         // each load action will set this again, so here we just set it back to default.
//         errorHandlerState: ErrorHandlerState.INIT,
//         successTimestamp: Date.now(),
//         error: undefined
//       };

//       return distinctState(oldState ?? INITIAL_LOADING_STATE, newState);
//     };

//     return this.setState({
//       loadingStates,
//       getNewState
//     });
//   }

//   /**
//    * Set state to failure.
//    * @param loadingStates List of existing loading states
//    * @param action Failure action
//    * @returns New loading state
//    */
//   private setFailure(loadingStates: LoadingStates, action: Action & FailureAction): LoadingStates {
//     const getNewState = (oldState: LoadingState) => {
//       oldState = oldState ?? INITIAL_LOADING_STATE;

//       const newState: Readonly<LoadingState> = {
//         type: LOADING_STATE,
//         loading: false,
//         success: false,
//         issueFetch: false,
//         // Leading this as is for the global error handler to check.
//         errorHandlerState: oldState.errorHandlerState,
//         successTimestamp: oldState.successTimestamp,
//         error: action.error
//       };

//       return distinctState(oldState, newState);
//     };

//     return this.setState({
//       loadingStates,
//       getNewState
//     });
//   }
// }
