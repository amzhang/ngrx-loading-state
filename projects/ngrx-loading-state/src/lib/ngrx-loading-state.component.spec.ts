import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgrxLoadingStateComponent } from './ngrx-loading-state.component';

describe('NgrxLoadingStateComponent', () => {
  let component: NgrxLoadingStateComponent;
  let fixture: ComponentFixture<NgrxLoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgrxLoadingStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgrxLoadingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
