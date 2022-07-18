import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { LoadingState } from '../lib/loading-state-types';
import * as SimpleActions from './simple.actions';
import * as SimpleSelectors from './simple.selectors';

@Injectable()
export class SimpleFacade {
  constructor(private store: Store) {}

  fetchCount(id: string): void {
    this.store.dispatch(SimpleActions.fetchCount.load({ id }));
  }

  getFetchCountState(): Observable<LoadingState> {
    return this.store.select(SimpleSelectors.fetchCountSelectors.state);
  }
}
