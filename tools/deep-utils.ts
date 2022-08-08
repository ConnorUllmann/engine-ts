import { DeepReadonly } from '../core/utils';

type Undefinable<T> = T extends (infer U)[]
  ? Array<Undefinable<U> | undefined>
  : T extends {}
  ? { [K in keyof T]: Undefinable<T[K]> | undefined }
  : T | undefined;

type DeepPartial<T> = T extends (infer U)[]
  ? Array<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type PrimitiveSerializable = null | undefined | boolean | number | string;
type Serializable = PrimitiveSerializable | Serializable[] | { [key: string]: Serializable };

export function DeepClone<T extends Serializable>(obj: DeepReadonly<T>): T {
  // null
  if (obj === null) return null as any;

  // undefined
  if (obj === undefined) return undefined as any;

  // booleans, numbers, strings
  if (typeof obj !== 'object') return obj as unknown as T;

  // arrays
  if (Array.isArray(obj)) return obj.map(o => DeepClone(o)) as any;

  // dictionaries
  const clone: { [key: string]: any } = {};
  for (let key in obj) clone[key] = DeepClone((obj as any)[key]);
  return clone as any;
}

export function DeepEquals(a: DeepReadonly<Serializable>, b: DeepReadonly<Serializable>): boolean {
  // null
  if (a === null) return b === null;
  if (b === null) return false;

  // undefined
  if (a === undefined) return b === undefined;
  if (b === undefined) return false;

  // booleans, numbers, strings
  if (typeof a !== 'object') return a === b;
  if (typeof b !== 'object') return false;

  // arrays
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && !a.some((aa, i) => !DeepEquals(aa, b[i]));
  if (Array.isArray(b)) return false;

  // dictionaries
  if (!DeepEquals(Object.keys(a), Object.keys(b))) return false;

  for (let key in a) if (!DeepEquals((a as any)[key], (b as any)[key])) return false;

  return true;
}

// if T is readonly, this will not error when passing in a readonly field into the mutable field "objOnto"
// apparently this is intended: https://stackoverflow.com/a/57168250
export function DeepApply<T extends Record<any, Serializable> | Array<Serializable>>(
  obj: DeepReadonly<Undefinable<DeepPartial<T>>>,
  objOnto: T
) {
  if (Array.isArray(obj)) {
    if (!Array.isArray(objOnto)) throw new Error(`Type mismatch during DeepApply`);
    objOnto.length = obj.length;
    for (let i = 0; i < obj.length; i++) objOnto[i] = DeepClone(obj[i]);
    return;
  }

  for (const key in obj) {
    const value = obj[key];
    if (value === undefined) {
      delete objOnto[key];
      continue;
    }

    if (value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
      objOnto[key] = value as any;
      continue;
    }

    if (key in objOnto) DeepApply(value as any, objOnto[key] as any);
    else objOnto[key] = DeepClone(value as any) as any;
  }
}

function loopAddKeys(obj: any, keys: string[], value: any) {
  const og = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] in obj) obj = obj[keys[i]];
    else obj = obj[keys[i]] = {};
  }
  obj[keys[keys.length - 1]] = value;
  return og;
}
function DeepDiffHelper<T extends Record<any, Serializable>>(
  objWithChanges: DeepReadonly<Undefinable<DeepPartial<T>>>,
  objOriginal: DeepReadonly<T>,
  compiledObj: any,
  keys: string[]
): void {
  const key = keys[keys.length - 1];
  const objWithChangesValue = objWithChanges[key];
  const objOriginalValue = objOriginal[key];
  if (
    objWithChangesValue === null ||
    objWithChangesValue === undefined ||
    typeof objWithChangesValue === 'number' ||
    typeof objWithChangesValue === 'boolean' ||
    typeof objWithChangesValue === 'string' ||
    Array.isArray(objWithChangesValue)
  ) {
    if (!DeepEquals(objOriginalValue, objWithChangesValue))
      loopAddKeys(compiledObj, keys, DeepClone(objWithChangesValue));
    return;
  }

  if (objOriginalValue === undefined) loopAddKeys(compiledObj, keys, DeepClone(objWithChangesValue));
  else if (
    typeof objOriginalValue !== 'number' &&
    typeof objOriginalValue !== 'string' &&
    typeof objOriginalValue !== 'boolean' &&
    objOriginalValue != null &&
    !Array.isArray(objOriginalValue)
  )
    for (const key2 in objWithChangesValue) {
      DeepDiffHelper(objWithChangesValue as any, objOriginalValue as any, compiledObj, [...keys, key2]);
    }

  if (typeof objOriginalValue === 'object' && !Array.isArray(objOriginalValue)) {
    for (const key2 in objOriginalValue)
      if (!(key2 in objWithChangesValue)) loopAddKeys(compiledObj, [...keys, key2], undefined);
  }
}

export function DeepDiff<T extends Record<any, Serializable>>(
  objWithChangesValue: DeepReadonly<Undefinable<DeepPartial<T>>>,
  objOriginalValue: DeepReadonly<T>
): Undefinable<DeepPartial<T>> {
  const result: Undefinable<DeepPartial<T>> = {} as unknown as Undefinable<DeepPartial<T>>;
  for (const key in objWithChangesValue) DeepDiffHelper(objWithChangesValue, objOriginalValue, result, [key]);
  return result;
}

// const aa = { a: { b: { c: { d: { e: { f: { g: 6 }}, h: 'hey' }}}}} as const
// const bb = { a: { b: { c: { d: { e: undefined }}}}} as const
// const aaa = DeepApply(bb, aa);
// console.log(aa);

// // doesn't look like this case can be caught: https://stackoverflow.com/a/57168250
// const aa: { readonly a: number } = { a: 5 }
// const bb: { readonly a: number } = { a: 6 }
// DeepApply(bb, aa);
// console.log(aa);

// const aa = { a: { b: { c: { d: { e: { f: { g: 6 }}, h: 'hey' }}}}} as const
// const bb = { a: { b: { c: { d: { h: 'hey' }}}}, i: true } as const
// const aaa = DeepDiff(bb, aa);
// console.log(aaa);
// const aa2 = DeepClone(aa);
// DeepApply(aaa, aa2);
// console.log(aa2);
// console.log(DeepEquals(aa2, bb));

// const aa = { a: { b: { c: { d: { e: { f: { g: 6 }}, h: 'hey', i: () => 6 }}}}}
// const aaa = DeepClone(aa);
// console.log(aaa);

// const aa: { readonly a: { readonly b: { readonly c: { readonly d: { readonly e: { f: { g: number }}, h: string }}} }} = { a: { b: { c: { d: { e: { f: { g: 6 }}, h: 'hey' }}}}}
// const aaa = DeepClone(aa);
// console.log(aaa);

// const aa = { a: { b: { c: { d: { e: { f: { g: 6 }}, h: 'hey', i: [{ aa: 5, bb: 6}, { aa: 3, bb: 7 }] }}}}}
// const bb = { a: { b: { c: { d: { e: { f: undefined }, i: [{ aa: 3, bb: 8}] }}}}}
// const aaa = DeepApply(bb, aa);
// console.log(aa);
