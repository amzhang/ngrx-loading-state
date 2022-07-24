# NgRx Loading State

NgRx Loading State consistently manages loading actions such as API fetches.

- [Reduce boiler plate and improve consistency](#reduce-boiler-plate-and-improve-consistency)

- [Avoid redundant API calls](#avoid-redundant-api-calls)

- [Sits on top of NgRx](#sits-on-top-of-ngrx)

- [Loading state is associated with actions](#loading-state-is-associated-with-actions)

# Features 

## Reduce boiler plate and improve consistency

The load, success, failure actions almost always go together. The reducers and selectors that deal with them are also boilerplates. User NgRx Loading State to have them automatically created. But more importantly, have them handle **consistently** across the application.\

## Avoid redundant API calls

NgRx Loading State decides if an API call needs to be made on a per action basis, using a maxAge concept around the timestamp of the last successful API call. With NgRx Loading State, you can issue loading actions in smart component wherever the data is needed, without explicitly needing to check if data already exists in the store.

## Sits on top of NgRx

All functions are helpers that delegates to NgRx components, so completely conforms to NGRX idioms. This means you can easily use this library for you new loading actions without making any changes to existing actions.

## Loading state is associated with actions

It is often necessary to load multiple pieces of data into the store with a single action for the sake of having a consistent collection of data (i.e. a single update of the state in the reducer). Therefore, the best place to track loading states is per action.

# Installation

```bash
npm install ngrx-loading-state
```

# Setup

For completeness, the complete code, including all imports, boilerplate for setting up ngrx etc are included below.

## Actions

```ts
// simple.actions.ts

import { createLoadingActions, failure, load, success } from 'ngrx-loading-state';

export const fetchUser = createLoadingActions(
  'Fetch User',
  load<{ userId: string }>(),
  success<{ user: object }>(),
  failure<{}>()
);
```

## Reducer

```ts
// simple.reducer.ts

import { createReducer } from '@ngrx/store';
import { getInitialState, WithLoadingStates } from 'ngrx-loading-state';
import { fetchUser } from './simple.actions';

export const SIMPLE_FEATURE_KEY = 'simple';

export type SimpleState = WithLoadingStates & {
  user?: object;
};

export const initialState: SimpleState = {
  ...getInitialState()
};

export const simpleReducer = createReducer(
  initialState,

  // fetchUser.reducer() returns an array of reducers to handle [load, success, failure] actions.
  // Usually on the success action need to be customised in the reducer, as is done here via the onSuccess()
  // callback.
  ...fetchUser.reducer<SimpleState>({
    onSuccess: (state, { user }): SimpleState => {
      return {
        ...state,
        user,
      };
    },
  }),
);
```

## Selectors
```ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { createLoadingStatesSelector } from 'ngrx-loading-state';
import { fetchUser } from './simple.actions';
import { SimpleState } from './simple.reducer';

// Boilerplate, only needed once per feature slice.
const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);
const selectLoadingStates = createLoadingStatesSelector(selectState);

export const fetchUserSelectors = fetchUser.createSelectors(selectLoadingStates);
```


## Effects
```ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filterLoading } from 'ngrx-loading-state';
import { map, switchMap } from 'rxjs/operators';
import { fetchUser } from './simple.actions';
import { fetchUserSelectors } from './simple.selectors';

@Injectable()
export class SimpleEffects {
  constructor(private actions$: Actions, private store: Store) {}

  fetchCount$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(fetchUser.load),

      // This filters out redundant API calls
      filterLoading(this.store.select(fetchUserSelectors.state)),

      switchMap((action) => {
        return of(true).pipe(
          delay(1000), // simulate loading.
          map(() => {
            return fetchUser.success({
              user: {},
            });
          }),
          // Errors will be updated into the loading state in the store for this action.
          fetchUser.catchError()
        );
      })
    );
  });
```

# Usage

You can issue loading actions anywhere, but usually they are issued in the smart component that needs the data. For example, a typical component might look like this:

```ts
@Component({
  selector: 'loading-state-demo',
  templateUrl: './loading-state-demo.component.html',
  styleUrls: ['./loading-state-demo.component.scss'],
})
export class LoadingStateDemoComponent {
  // The loading state contains these fields:
  //   loading: boolean - is API in progress?
  //   success: boolean - did last API call succeed? False if API call in progress
  //   successTimestamp?: boolean - Unix time of last successful API call
  //   error?: boolean - error from latest API call, undefined curren API call in progress or no error from last API call.
  fetchUserState$ = this.store.select(fetchUserSelectors.state);
 
  constructor(private store: Store) {
    this.simpleFacade.fetchUser({ userId: '123' });
  }
}
```

and in the html template you can react to the loading state:

```html
<div>{{ (fetchUserState$ | async)?.success ? 'Data has loaded' : 'Data has not loaded yet'}}</div>

```

By default, loading action always issue a new API call:

```ts
this.simpleFacade.fetchUser({ userId: '123' });
```

if you don't want to issue an new API call if one is already in progress, then use:

```ts
this.simpleFacade.fetchUser({ userId: '123', maxAge: MAX_AGE_LATEST });
```

if you don't want to issue a new API call if the last successful API call was less than 5 seconds ago, then use:

```ts
this.simpleFacade.fetchUser({ userId: '123', maxAge: 5000 });
```

if you don't want to issue a new API call as long as data has been successfully loaded previously:

```ts
this.simpleFacade.fetchUser({ userId: '123', maxAge: Infinity });
```


