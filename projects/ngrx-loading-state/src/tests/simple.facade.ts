import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Id, IdLoadingState } from '../lib/id-loading-state/id-loading-state-types';
import { LoadAction, LoadingState } from '../public-api';
import * as SimpleActions from './simple.actions';
import { IdCount } from './simple.reducer';
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
    return this.store.select(SimpleSelectors.selectCount);
  }

  // Id loading state
  fetchIdCount(options: { id: Id; count: number; forceFailure?: boolean } & LoadAction): void {
    this.store.dispatch(SimpleActions.fetchIdCount.idLoad(options));
  }

  getFetchIdCountState(id: Id): Observable<IdLoadingState> {
    return this.store.select(SimpleSelectors.fetchIdCountSelectors.state(id));
  }

  getIdCount(id: Id): Observable<IdCount | undefined> {
    return this.store.select(SimpleSelectors.selectIdCount(id));
  }
}
