import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer } from '@ngrx/store';
import { getInitialState } from '../lib/functions';
import { WithLoadingStates } from '../public-api';
import { fetchCount, fetchIdCount } from './simple.actions';

export const SIMPLE_FEATURE_KEY = 'simple';

export interface IdCount {
  id: string;
  count: number;
}

export type SimpleState = WithLoadingStates & {
  count: number;
  idCounts: EntityState<IdCount>;
};

export const idCountAdapter = createEntityAdapter<IdCount>();

export const initialState: SimpleState = {
  ...getInitialState(),
  count: 0,
  idCounts: idCountAdapter.getInitialState()
};

export const simpleReducer = createReducer(
  initialState,
  ...fetchCount.reducer<SimpleState>({
    onSuccess: (state, { count }): SimpleState => {
      return {
        ...state,
        count
      };
    }
  }),
  ...fetchIdCount.reducer<SimpleState>({
    onSuccess: (state, { count, id }): SimpleState => {
      return {
        ...state,
        idCounts: idCountAdapter.upsertOne({ id, count }, state.idCounts)
      };
    }
  })
);
