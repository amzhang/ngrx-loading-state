export type NoIntersection<A, B extends object> = {
  [K in keyof A]: K extends keyof B ? never : A[K];
};
