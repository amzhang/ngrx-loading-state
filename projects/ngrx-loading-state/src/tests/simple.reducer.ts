import { createReducer } from '@ngrx/store';

export const SIMPLE_FEATURE_KEY = 'simple';

export interface SimpleState {
  count: number;
}

export const initialState: SimpleState = {
  count: 0,
};

export const simpleReducer = createReducer(initialState);
