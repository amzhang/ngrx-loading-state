import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Store, StoreModule } from '@ngrx/store';
import { fetchCount } from './simple.actions';
import { simpleReducer, SIMPLE_FEATURE_KEY } from './simple.reducer';
// import { MyCounterComponent } from '../my-counter/my-counter.component';
// import { counterReducer } from '../counter.reducer';

describe('Simple test', () => {
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        StoreModule.forRoot({}),
        StoreModule.forFeature(SIMPLE_FEATURE_KEY, simpleReducer),
        // EffectsModule.forFeature([VaultEffects]),
      ],
    });

    store = TestBed.inject(Store);
  });

  it('should create state', () => {
    expect(true).toBeTruthy();

    store.dispatch(fetchCount.load({ id: 'test 1' }));
  });
});
