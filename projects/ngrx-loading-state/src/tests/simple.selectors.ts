import { createFeatureSelector, createSelector } from '@ngrx/store';
import { createIdLoadingStatesSelector, createLoadingStatesSelector } from '../public-api';
import { fetchCount, fetchIdCount } from './simple.actions';
import { idCountAdapter, SimpleState, SIMPLE_FEATURE_KEY } from './simple.reducer';

const selectState = createFeatureSelector<SimpleState>(SIMPLE_FEATURE_KEY);

// Loading state selectors
const selectLoadingStates = createLoadingStatesSelector(selectState);
const selectIdLoadingStates = createIdLoadingStatesSelector(selectState);

export const fetchCountSelectors = fetchCount.createSelectors(selectLoadingStates);
export const fetchIdCountSelectors = fetchIdCount.createIdSelectors(selectIdLoadingStates);

// Data selectors
export const selectCount = createSelector(selectState, (state) => state.count);
export const selectIdCounts = createSelector(selectState, (state) => state.idCounts);
export const idCountSelectors = idCountAdapter.getSelectors(selectIdCounts);
export const selectIdCount = (id: string) => {
  return createSelector(idCountSelectors.selectEntities, (idCounts) => {
    return idCounts[id];
  });
};
