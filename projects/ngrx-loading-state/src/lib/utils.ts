export type NoIntersection<A, B extends object> = {
  [K in keyof A]: K extends keyof B ? never : A[K];
};

export type GetterSetter<T> = (setValue?: T) => T | undefined;

// The action objects are frozen, so we can't add or change any fields. This gets
// around it by capturing the "value" variable via the function closure. Since freeze()
// only recursively freezes POJO object, it can't see in side the functions.
export function createGetterSetter<T>(initialValue?: T): GetterSetter<T> {
  let value = initialValue;

  return (setValue?: T): T | undefined => {
    if (setValue !== undefined) {
      value = setValue;
    }
    return value;
  };
}
