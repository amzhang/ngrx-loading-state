import {
  createLoadingActions,
  failure,
  load,
  success,
} from '../lib/loading-state-creators';

export const fetchCount = createLoadingActions(
  'Fetch',
  load<{ id: string }>(),
  success<{ count: number }>(),
  failure<{}>()
);
