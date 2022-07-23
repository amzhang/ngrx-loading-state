import {
  createIdLoadingActions,
  createLoadingActions,
  failure,
  idFailure,
  idLoad,
  idSuccess,
  load,
  success
} from '../public-api';

export const fetchCount = createLoadingActions(
  'Fetch Count',
  load<{ count: number; forceFailure?: boolean }>(),
  success<{ count: number }>(),
  failure<{}>()
);

export const fetchIdCount = createIdLoadingActions(
  'Fetch Id Count',
  idLoad<{ count: number; forceFailure?: boolean }>(),
  idSuccess<{ count: number }>(),
  idFailure<{}>()
);
