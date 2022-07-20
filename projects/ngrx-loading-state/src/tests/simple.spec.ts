import { TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule, USER_PROVIDED_META_REDUCERS } from '@ngrx/store';
import {
  FailureAction,
  globalErrorReducerFactory,
  LoadingState,
  MAX_AGE_LATEST
} from '../public-api';

import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { first } from 'rxjs';
import { fetchCount, fetchIdCount } from './simple.actions';
import { SimpleEffects } from './simple.effects';
import { SimpleFacade } from './simple.facade';
import { simpleReducer, SIMPLE_FEATURE_KEY } from './simple.reducer';

describe('Simple test', () => {
  let globalFailureAction: FailureAction | null = null;
  let globalFailureState: LoadingState | null = null;

  function errorHandler(failureAction: FailureAction, state: LoadingState) {
    globalFailureAction = failureAction;
    globalFailureState = state;
  }

  let store: Store;
  let simpleFacade: SimpleFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      providers: [
        SimpleFacade,
        {
          provide: USER_PROVIDED_META_REDUCERS,
          useValue: [globalErrorReducerFactory(errorHandler)]
        }
      ],
      imports: [
        StoreModule.forRoot({}),
        StoreModule.forFeature(SIMPLE_FEATURE_KEY, simpleReducer),
        EffectsModule.forRoot(),
        EffectsModule.forFeature([SimpleEffects]),
        StoreDevtoolsModule.instrument({
          serialize: {
            // This allows the contents of non-serializable types such as "set" and "map" to be displayed.
            options: true
          }
        })
      ]
    });

    store = TestBed.inject(Store);
    simpleFacade = TestBed.inject(SimpleFacade);
  });

  it('should fetch count', async () => {
    await new Promise((resolve) => {
      simpleFacade
        .getFetchCountState()
        .pipe(first())
        .subscribe((state) => {
          expect(state).toBeUndefined();
          resolve(0);
        });
    });

    store.dispatch(fetchCount.load({ count: 5 }));

    await new Promise((resolve) => {
      simpleFacade.getFetchCountState().subscribe((state) => {
        if (!state.loading) {
          expect(state.error).toBeUndefined();
          resolve(0);
        }
      });
    });

    await new Promise((resolve) => {
      simpleFacade.getCount().subscribe((count) => {
        expect(count).toBe(5);
        resolve(0);
      });
    });
  });

  it('should use global error handler', async () => {
    globalFailureAction = null;
    globalFailureState = null;

    store.dispatch(fetchCount.load({ count: 10, forceFailure: true }));

    await new Promise((resolve) => {
      simpleFacade.getFetchCountState().subscribe((state) => {
        if (!state.loading) {
          expect(state.error).toBeTruthy();
          resolve(0);
        }
      });
    });

    expect(globalFailureAction).toBeTruthy();
    expect(globalFailureState).toBeTruthy();
  });

  it('should use local error handler', async () => {
    globalFailureAction = null;
    globalFailureState = null;

    store.dispatch(fetchCount.load({ count: 10, forceFailure: true, localError: true }));

    await new Promise((resolve) => {
      simpleFacade.getFetchCountState().subscribe((state) => {
        if (!state.loading) {
          expect(state.error).toBeTruthy();
          resolve(0);
        }
      });
    });

    expect(globalFailureAction).toBeNull();
    expect(globalFailureState).toBeNull();
  });

  it('should filter out redundant loading actions', async () => {
    const apiCallsBefore = SimpleEffects.apiCalls;

    store.dispatch(fetchCount.load({ count: 10, maxAge: Infinity }));
    store.dispatch(fetchCount.load({ count: 10, maxAge: Infinity }));
    store.dispatch(fetchCount.load({ count: 10, maxAge: Infinity }));

    await new Promise((resolve) => {
      simpleFacade.getFetchCountState().subscribe((state) => {
        if (!state.loading) {
          resolve(0);
        }
      });
    });

    const apiCallsAfter = SimpleEffects.apiCalls;

    expect(apiCallsAfter - apiCallsBefore).toBe(1);
  });

  it('should respect maxAge', async () => {
    expect(true).toBeTruthy();

    const apiCallsBefore = SimpleEffects.apiCalls;

    store.dispatch(fetchCount.load({ count: 10, maxAge: Infinity }));
    // This next loading action should be filtered out since we consider
    // the current in progress loading action have an age of zero. Therefore age is under the specified maxAge threshold.
    store.dispatch(fetchCount.load({ count: 10, maxAge: 100 }));
    // This next loading action should be carried out because when maxAge is not specified, always issue an API call.
    store.dispatch(fetchCount.load({ count: 10 }));
    // Filtered out because we consider the data returned by the currently active API call to be the latest.
    store.dispatch(fetchCount.load({ count: 10, maxAge: MAX_AGE_LATEST }));

    await new Promise((resolve) => {
      simpleFacade.getFetchCountState().subscribe((state) => {
        if (!state.loading) {
          resolve(0);
        }
      });
    });

    const apiCallsAfter = SimpleEffects.apiCalls;

    expect(apiCallsAfter - apiCallsBefore).toBe(2);
  });

  it('should test id load', async () => {
    store.dispatch(fetchIdCount.idLoad({ id: '1', count: 5 }));
    store.dispatch(fetchIdCount.idLoad({ id: '2', count: 10 }));
    // This will issue an API call
    store.dispatch(fetchIdCount.idLoad({ id: '1', count: 15 }));
    // This will be ignored
    store.dispatch(fetchIdCount.idLoad({ id: '2', count: 20, maxAge: 1000 }));

    await new Promise((resolve) => {
      simpleFacade
        .getFetchIdCountState('3')
        .pipe(first())
        .subscribe((state) => {
          expect(state).toBeUndefined();
          resolve(0);
        });
    });

    await new Promise((resolve) => {
      simpleFacade.getFetchIdCountState('1').subscribe((state) => {
        if (!state.loading) {
          expect(state.error).toBeUndefined();
          resolve(0);
        }
      });
    });

    await new Promise((resolve) => {
      simpleFacade.getIdCount('1').subscribe((idCount) => {
        expect(idCount?.count).toBe(15);
        resolve(0);
      });
    });

    await new Promise((resolve) => {
      simpleFacade.getFetchIdCountState('2').subscribe((state) => {
        if (!state.loading) {
          expect(state.error).toBeUndefined();
          resolve(0);
        }
      });
    });

    await new Promise((resolve) => {
      simpleFacade.getIdCount('2').subscribe((idCount) => {
        expect(idCount?.count).toBe(10);
        resolve(0);
      });
    });
  });
});
