import { createReducer } from '@ngrx/store';
import { initialise, WithLoadingStates } from '../public-api';
import { fetchCount } from './simple.actions';

export const SIMPLE_FEATURE_KEY = 'simple';

export type SimpleState = WithLoadingStates & {
  count: number;
};

export const initialState: SimpleState = {
  loadingStates: initialise(),
  count: 0
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
  })
);
