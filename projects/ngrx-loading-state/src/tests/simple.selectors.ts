import { createFeatureSelector, createSelector } from '@ngrx/store';
import { createLoadingStatesSelector } from '../public-api';
import { fetchCount } from './simple.actions';
import { SimpleState, SIMPLE_FEATURE_KEY } from './simple.reducer';

const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);
const selectLoadingStates = createLoadingStatesSelector(selectState);

export const fetchCountSelectors = fetchCount.createSelectors(selectLoadingStates);

export const getCount = createSelector(selectState, (state) => state.count);
