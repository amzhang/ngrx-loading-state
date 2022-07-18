import { createLoadingActions, failure, load, success } from '../public-api';

export const fetchCount = createLoadingActions(
  'Fetch Count',
  load<{ count: number; forceFailure?: boolean }>(),
  success<{ count: number }>(),
  failure<{}>()
);
