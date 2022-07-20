import { WithLoadingStates } from './types';

export function initialise(): WithLoadingStates {
  return {
    loadingStates: {},
    idLoadingStates: {}
  };
}
