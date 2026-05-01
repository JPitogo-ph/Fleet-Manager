type OmitUndefined<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: Exclude<T[K], undefined>;
};

export function stripUndefinedKeys<T extends Record<string, unknown>>(
  obj: T
): OmitUndefined<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as OmitUndefined<T>;
}