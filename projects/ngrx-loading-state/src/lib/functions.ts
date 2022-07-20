import { WithLoadingStates } from './types';

export function getInitialState(): WithLoadingStates {
  return {
    loadingStates: {},
    idLoadingStates: {}
  };
}
