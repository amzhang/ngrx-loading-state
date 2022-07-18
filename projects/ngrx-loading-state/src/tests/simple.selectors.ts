import { createFeatureSelector } from '@ngrx/store';
import { createLoadingStatesSelector } from '../lib/loading-state-actions';
import { fetchCount } from './simple.actions';
import { SimpleState, SIMPLE_FEATURE_KEY } from './simple.reducer';

const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);
const selectLoadingStates = createLoadingStatesSelector(selectState);

export const fetchCountSelectors =
  fetchCount.createSelectors(selectLoadingStates);
