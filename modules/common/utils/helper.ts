export function pick<T extends object>(obj: T, keys: (keyof T)[]) {
  const ret: Partial<T> = {};
  for (const key of keys) {
    ret[key] = obj[key];
  }
  return ret;
}
