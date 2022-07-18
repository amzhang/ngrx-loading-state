import { createLoadingActions, failure, load, success } from '../lib/loading-state-creators';

export const fetchCount = createLoadingActions(
  'Fetch Count',
  load<{ count: number; forceFailure?: boolean }>(),
  success<{ count: number }>(),
  failure<{}>()
);
