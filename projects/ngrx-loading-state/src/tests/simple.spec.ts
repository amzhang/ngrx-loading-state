import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StoreModule } from '@ngrx/store';
import { simpleReducer, SIMPLE_FEATURE_KEY } from './simple.reducer';
// import { MyCounterComponent } from '../my-counter/my-counter.component';
// import { counterReducer } from '../counter.reducer';

describe('Simple test', () => {
  //   let component: MyCounterComponent;
  //   let fixture: ComponentFixture<MyCounterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        StoreModule.forFeature(SIMPLE_FEATURE_KEY, simpleReducer),
        // EffectsModule.forFeature([VaultEffects]),
      ],
    }).compileComponents();

    // fixture = TestBed.createComponent(MyCounterComponent);
    // component = fixture.debugElement.componentInstance;
    // fixture.detectChanges();
  }));

  it('should create state', () => {
    expect(true).toBeTruthy();
  });
});
