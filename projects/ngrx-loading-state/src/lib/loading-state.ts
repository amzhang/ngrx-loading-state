export enum ErrorHandler {
  INIT = 'INIT',
  GLOBAL = 'GLOBAL',
  LOCAL = 'LOCAL',
}

export interface LoadingState<Error = any> {
  loading: boolean; // Api is loading
  success: boolean; // Api returned successfully
  issueFetch: boolean; // true if we should issue a fetch
  errorHandler: ErrorHandler;
  successTimestamp?: number; // Millisecond unix timestamp of when data is loaded. Date.now()
  error?: Error; // Api returned error
}

export interface LoadingStates {
  [key: string]: LoadingState;
}

export interface WithLoadingStates {
  loadingStates: LoadingStates;
}

export function initialise(): LoadingStates {
  return {} as LoadingStates;
}
