import { TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { fetchCount } from './simple.actions';
import { SimpleFacade } from './simple.facade';
import { simpleReducer, SIMPLE_FEATURE_KEY } from './simple.reducer';

describe('Simple test', () => {
  let store: Store;
  let simpleFacade: SimpleFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      providers: [SimpleFacade],
      imports: [
        StoreModule.forRoot({}),
        StoreModule.forFeature(SIMPLE_FEATURE_KEY, simpleReducer),
        // EffectsModule.forFeature([VaultEffects]),
      ],
    });

    store = TestBed.inject(Store);
    simpleFacade = TestBed.inject(SimpleFacade);
  });

  it('should create state', async () => {
    expect(true).toBeTruthy();

    store.dispatch(fetchCount.load({ id: 'test 1' }));
    const fetchCountState$ = simpleFacade.getFetchCountState();

    await new Promise((resolve) => {
      fetchCountState$.subscribe((state) => {
        console.log(state);
        resolve(0);
      });
    });
  });
});
