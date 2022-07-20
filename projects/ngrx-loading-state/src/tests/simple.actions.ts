import { idFailure, idLoad, idSuccess } from '../lib/id-loading-state/id-loading-state-creators';
import {
  createIdLoadingActions,
  createLoadingActions,
  failure,
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
