import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { LoadAction, LoadingState } from '../lib/loading-state-types';
import * as SimpleActions from './simple.actions';
import * as SimpleSelectors from './simple.selectors';

@Injectable()
export class SimpleFacade {
  constructor(private store: Store) {}

  fetchCount(options: { count: number; forceFailure?: boolean } & LoadAction): void {
    this.store.dispatch(SimpleActions.fetchCount.load(options));
  }

  getFetchCountState(): Observable<LoadingState> {
    return this.store.select(SimpleSelectors.fetchCountSelectors.state);
  }

  getCount(): Observable<number> {
    return this.store.select(SimpleSelectors.getCount);
  }
}
