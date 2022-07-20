import { WithIdLoadingStatesOnly } from './id-loading-state/id-loading-state-types';
import { WithLoadingStatesOnly } from './loading-state/loading-state-types';

export type WithLoadingStates = WithLoadingStatesOnly & WithIdLoadingStatesOnly;
