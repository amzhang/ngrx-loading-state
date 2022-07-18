import { TestBed } from '@angular/core/testing';

import { NgrxLoadingStateService } from './ngrx-loading-state.service';

describe('NgrxLoadingStateService', () => {
  let service: NgrxLoadingStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgrxLoadingStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
