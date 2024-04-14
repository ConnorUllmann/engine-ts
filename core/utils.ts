import { RNG } from './rng';

export function log(text: string, level = 'info') {
  let d = new Date();
  let dateString =
    d.getFullYear() +
    '-' +
    ('0' + (d.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + d.getDate()).slice(-2) +
    ' ' +
    ('0' + d.getHours()).slice(-2) +
    ':' +
    ('0' + d.getMinutes()).slice(-2) +
    ':' +
    ('0' + d.getSeconds()).slice(-2) +
    '.' +
    ('00' + d.getMilliseconds()).slice(-3) +
    ' UTC' +
    (d.getTimezoneOffset() > 0 ? '-' : '+') +
    Math.abs(d.getTimezoneOffset() / 60);
  const textFinal = `[${level}][${dateString}] ${text}`;
  switch (level) {
    case 'error':
      console.error(textFinal);
      break;
    case 'warn':
      console.warn(textFinal);
      break;
    default:
      console.log(textFinal);
      break;
  }
}

export function clamp(value: number, min: number, max: number) {
  return value <= min ? min : value >= max ? max : value;
}

export function millisecondsToExecute(call: () => any): number {
  const start = performance.now();
  call();
  const end = performance.now();
  return Math.round((end - start) * 10) / 10;
}

export async function sleep(milliseconds: number) {
  await new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function assertNever(x: never, shouldThrow = false): void {
  const message = `Argument "${(x as any)?.toString() ?? x}" should not have existed to be passed here.`;
  if (shouldThrow) {
    throw new Error(message);
  } else {
    console.error(message);
  }
  return;
}

export function assertTypeNever<T extends never>(_?: T): void {}

/**
 * Throws an error and type is inferred to whatever is needed. Useful for situations like wanting to throw in a ternary operator.
 * @param args Arguments for the error that is thrown.
 * @example
 * ```typescript
 * const x = y >= 0 ? 'test' : punt(); // allows throwing while part of a single statement
 * ```
 */
export function punt<T = never>(...args: ConstructorParameters<typeof Error>): T {
  throw new Error(...args);
}

/**
 * Transforms a list into a mapping of its items to arbitrary keys/values.
 * @param list List to turn into a map
 * @param getKey Function taking an element of the list and returning the key for its entry in the map
 * @param getValue Function taking an element of the list and returning the value for its entry in the map
 * @returns The map after executing on each element of the list and adding their entries.
 * @example
 * ```typescript
 * const value = mapFromList(
 *   ['a', 'b'] as const,
 *   x => x,
 *   x => 0 as const
 * );
 * // { a: 0, b: 0 }
 * // Record<"a" | "b", 0>
 * ```
 */
export function mapFromList<A, T extends PropertyKey, U>(
  list: ReadonlyArray<A>,
  getKey: (a: A, index: number) => T,
  getValue: (a: A, index: number) => U
): Record<T, U> {
  return list.reduce((acc, item, index) => {
    acc[getKey(item, index)] = getValue(item, index);
    return acc;
  }, {} as Record<T, U>);
}

// https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711#3561711
export function escapeRegex(text: string): string {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export const tau = 6.283185307179586;
export const angle360 = tau;
export const angle315 = 5.497787143782138;
export const angle300 = 5.235987755982989;
export const angle270 = 4.71238898038469;
export const angle240 = 4.1887902047863905;
export const angle225 = 3.9269908169872414;
export const angle180 = 3.141592653589793;
export const angle135 = 2.356194490192345;
export const angle120 = 2.0943951023931953;
export const angle90 = 1.5707963267948966;
export const angle60 = 1.0471975511965976;
export const angle45 = 0.7853981633974483;
export const angle30 = 0.5235987755982988;
export const angle15 = 0.2617993877991494;
export const angleGolden = 2.39996322972865332;
export const sqrt2 = 1.4142135623730951;
export const sqrt3 = 1.7320508075688772;
export const sqrt5 = 2.23606797749979;

export function binomialCoefficient(n: number, k: number) {
  let result = 1;
  for (let i = n - k + 1; i <= n; i++) result *= i;
  for (let i = 1; i <= k; i++) result /= i;
  return result;
}

// calculates "value % modulo" but wraps negative numbers so the result is always in the range [0, modulo)
//
// -270 % 360 = -270
// moduloSafe(-270, 360) = 90
//
// -540 % 360 = -180
// moduloSafe(-540, 360) = 180
export function moduloSafe(value: number, modulo: number) {
  return modulo == 0 ? 0 : ((value % modulo) + modulo) % modulo;
}

// https://stackoverflow.com/a/55365334
export function getGuidPart(_rng?: Pick<RNG, 'random'>): string {
  return (((1 + (_rng ?? rng).random()) * 0x10000) | 0).toString(16).substring(1);
}
export function getGuid(): string {
  return `${getGuidPart()}${getGuidPart()}-${getGuidPart()}-${getGuidPart()}-${getGuidPart()}-${getGuidPart()}${getGuidPart()}${getGuidPart()}`;
}

export const rng = new RNG();
console.log(`Global random seed: ${rng.seed}`);
export const random = () => rng.random();
export const randomSign = (includeZero?: boolean) => rng.randomSign(includeZero);
export const randomRange = (min: number, max: number) => rng.randomRange(min, max);
export const randomChoice = <const T extends readonly any[]>(...options: T): T[number] => rng.randomChoice(...options);

export const repeat = function <T>(count: number, get: (i: number, count: number) => T): T[] {
  const array: T[] = [];
  for (let i = 0; i < count; i++) {
    array.push(get(i, count));
  }
  return array;
};

// https://stackoverflow.com/a/49670389
export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;
interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}
type DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

export type NonEmptyArray<T> = [T, ...T[]];

export function enumToList<Enum, EnumValue extends Enum[keyof Enum] & string>(
  _enum: EnumValue extends Exclude<EnumValue, number> ? Enum : never
): EnumValue[];
export function enumToList<Enum, EnumValue extends Enum[keyof Enum] & number>(
  _enum: EnumValue extends Exclude<EnumValue, string> ? Enum : never
): EnumValue[];
export function enumToList<Enum, EnumValue extends Enum[keyof Enum] & (number | string)>(
  _enum: EnumValue
): EnumValue[] {
  const values = Object.values(_enum);
  return values.any(value => typeof value === 'number')
    ? values.filter(value => !isNaN(parseFloat(value.toString())))
    : values;
}

// pass in a mapping for the first argument and an enum for the second argument to get a type-check that the
// first argument contains all the enum values as keys but return the first argument with its type left as-is
// rather than obfuscating it as a Record type
// e.g.
//
// enum A { a='Aa', b='Ab', c='Ac', d='Ad' }
// const x = verifiedMapping({ [A.a]: 1, [A.c]: 2 } as const, A, A.b, A.d);
//
// x will have type { readonly Aa: 1, readonly Ac: 2 } instead of Record<A, number> but with the guarantee that
// all keys of A are present at compile-time (excluding any additional optional elements of A passed into the function)
export function verifiedMapping<
  U extends Record<PropertyKey, PropertyKey>,
  T extends Record<PropertyKey, PropertyKey>,
  E extends T[keyof T][]
>(
  record: Exclude<`${Exclude<T[keyof T], symbol>}`, `${Exclude<E[number], symbol>}`> extends infer Expected
    ? `${Exclude<keyof U, symbol>}` extends infer Actual
      ? Exclude<Actual, Expected> extends never
        ? Exclude<Expected, Actual> extends never
          ? U
          : { [K in Exclude<T[keyof T], E[number]>]: any }
        : { [K in Exclude<T[keyof T], E[number]>]: any }
      : { [K in Exclude<T[keyof T], E[number]>]: any }
    : { [K in Exclude<T[keyof T], E[number]>]: any },
  enumToMatchKeysWith: T,
  ...exclusions: E
): U {
  return record as U;
}

export type InvertedRecord<T extends Record<PropertyKey, PropertyKey>> = {
  [P in keyof T as T[P]]: P;
};

// inverts a mapping while maintaining the specific relationships between values (rather than a generic inversion of Record arguments)
// e.g.
//
// enum A { a='Aa', b='Ab' }
// const x = verifiedMapping({ [A.a]: 1, [A.b]: 2 } as const, A);
// const y = invertMapping(x);
//
// y will have type { readonly 1: "Aa", readonly 2: "Ab" } instead of Record<number, A>
export function invertMapping<T extends Record<PropertyKey, PropertyKey>>(mapping: T): InvertedRecord<T> {
  const invertedMapping = {} as InvertedRecord<T>;
  for (let key in mapping) invertedMapping[mapping[key]] = key as any;
  return invertedMapping;
}

declare global {
  interface Set<T> {
    union(other: Set<T>): this;
    difference(other: Set<T>): this;
    intersection(other: Set<T>): this;
    any(boolCheck: (o: T, i: number) => boolean): boolean;
    all(boolCheck: (o: T, i: number) => boolean): boolean;
    first(boolCheck?: ((o: T, i: number) => boolean) | null): T | null;
  }
}

Set.prototype.union = function <T>(other: Set<T>): Set<T> {
  for (let o of other) this.add(o);
  return this;
};

Set.prototype.difference = function <T>(other: Set<T>): Set<T> {
  for (let o of other) this.delete(o);
  return this;
};

Set.prototype.intersection = function <T>(other: Set<T>): Set<T> {
  for (let o of this) if (!other.has(o)) this.delete(o);
  return this;
};

Set.prototype.any = function <T>(boolCheck: (t: T, i: number) => boolean): boolean {
  let count = 0;
  for (let t of this) {
    if (boolCheck(t, count++)) return true;
  }
  return false;
};

Set.prototype.all = function <T>(boolCheck: (t: T, i: number) => boolean): boolean {
  let count = 0;
  for (let t of this) {
    if (!boolCheck(t, count++)) return false;
  }
  return true;
};

Set.prototype.first = function <T>(boolCheck: ((o: T, i: number) => boolean) | null = null): T | null {
  let count = 0;
  for (let t of this) {
    if (!boolCheck || boolCheck(t, count++)) return t;
  }
  return null;
};

// TODO apply as many of these as possible to ReadonlyArray as well
declare global {
  interface Array<T> {
    swap(firstIndex: number, secondIndex: number): void;
    insert(index: number, item: T): void;
    remove(item: T): number | null;
    removeAt(index: number): T | null;
    removeAtMultiple(...indices: number[]): T[];
    removeFirstWhere(valueGetter: (o: T, i: number) => boolean): T | null;
    removeWhere(valueGetter: (o: T, i: number) => boolean): T[];
    reversed(): T[];
    sample(_rng?: Pick<RNG, 'random'>): T | null;
    samples(count: number, _rng?: Pick<RNG, 'random'>): T[];
    shuffle(_rng?: Pick<RNG, 'random'>): T[];
    shuffled(_rng?: Pick<RNG, 'random'>): T[];
    flattened(): T;
    unflattened(width: number): T[][];
    batchify(batchSize: number): T[][];
    any(boolCheck: (o: T, i: number) => boolean): boolean;
    all(boolCheck: (o: T, i: number) => boolean): boolean;
    first(boolCheck?: ((o: T, i: number) => boolean) | null): T | null;
    last(boolCheck?: ((o: T, i: number) => boolean) | null): T | null;
    bestOf(boolCheck: (o: T) => boolean): T | null;
    minOf(valueGetter: (o: T) => number): T | null;
    maxOf(valueGetter: (o: T) => number): T | null;
    minValueOf(valueGetter: (o: T) => number): number | null;
    maxValueOf(valueGetter: (o: T) => number): number | null;
    sumOf(valueGetter: (o: T) => number): number | null;
    mappedBy(keyGetter: (o: T) => string): { [key: string]: T[] };
    mappedByUnique(keyGetter: (o: T) => string): { [key: string]: T };
    copy(other: T[]): void;
    clone(): T[];
    clear(): void;
    orderBy(getter: (a: T) => number): T[];
    distinct(valueGetter?: (o: T) => string | number): T[];
    distincted(valueGetter?: (o: T) => string | number): T[];
    exists(): NonNullable<T>[];

    // number only
    min(this: Array<number>): number | null;
    max(this: Array<number>): number | null;
    sum(this: Array<number>): number | null;
  }

  interface ReadonlyArray<T> {
    reversed(): T[];
    sample(_rng?: Pick<RNG, 'random'>): T | null;
    samples(count: number, _rng?: Pick<RNG, 'random'>): T[];
    shuffled(_rng?: Pick<RNG, 'random'>): T[];
    flattened(): T;
    unflattened(width: number): T[][];
    batchify(batchSize: number): T[][];
    any(boolCheck: (o: T, i: number) => boolean): boolean;
    all(boolCheck: (o: T, i: number) => boolean): boolean;
    first(boolCheck?: ((o: T, i: number) => boolean) | null): T | null;
    last(boolCheck?: ((o: T, i: number) => boolean) | null): T | null;
    bestOf(boolCheck: (o: T) => boolean): T | null;
    minOf(valueGetter: (o: T) => number): T | null;
    maxOf(valueGetter: (o: T) => number): T | null;
    minValueOf(valueGetter: (o: T) => number): number | null;
    maxValueOf(valueGetter: (o: T) => number): number | null;
    sumOf(valueGetter: (o: T) => number): number | null;
    mappedBy(keyGetter: (o: T) => string): { [key: string]: T[] };
    mappedByUnique(keyGetter: (o: T) => string): { [key: string]: T };
    copy(other: T[]): void;
    clone(): T[];
    distincted(valueGetter?: (o: T) => string | number): T[];
    exists(): NonNullable<T>[];

    // number only
    min(this: Array<number>): number | null;
    max(this: Array<number>): number | null;
    sum(this: Array<number>): number | null;
  }
}

Array.prototype.swap = function (firstIndex: number, secondIndex: number): void {
  this[firstIndex] = this.splice(secondIndex, 1, this[firstIndex])[0];
};

Array.prototype.insert = function <T>(index: number, ...items: T[]): void {
  this.splice(index, 0, ...items);
};

Array.prototype.remove = function <T>(item: T): number | null {
  if (item == null) return null;
  const index = this.indexOf(item);
  if (index == -1) return null;
  this.removeAt(index);
  return index;
};

Array.prototype.removeAt = function <T>(index: number): T | null {
  if (index < 0 || index >= this.length) return null;
  const item = this[index];
  this.splice(index, 1);
  return item;
};

// returns the elements at the current indices after they've been removed from the array
// (items return in the reverse order they were in the array;
//  call .reversed() on the return value to flip it if necessary)
Array.prototype.removeAtMultiple = function <T>(...indices: number[]): T[] {
  return indices.sort((a, b) => b - a).map((index: number) => this.removeAt(index));
};

Array.prototype.removeFirstWhere = function <T>(valueGetter: (o: T, i: number) => boolean): T | null {
  for (let i = 0; i < this.length; i++) {
    if (valueGetter(this[i], i)) {
      return this.splice(i, 1).first();
    }
  }
  return null;
};

Array.prototype.removeWhere = function <T>(valueGetter: (o: T, i: number) => boolean): T[] {
  const indicesToRemove = this.reduce((list: number[], obj: T, index: number) => {
    if (valueGetter(obj, index)) list.push(index);
    return list;
  }, []).reversed();
  return indicesToRemove.map((index: number) => {
    const item = this[index];
    this.splice(index, 1);
    return item;
  });
};

//Returns a new array that is a reverse of the given array
Array.prototype.reversed = function <T>(): T[] {
  const list = this.clone();
  list.reverse();
  return list;
};

//Returns a random element of the array
Array.prototype.sample = function <T>(_rng: Pick<RNG, 'random'> = rng): T | null {
  return this.length > 0 ? this[Math.floor(_rng.random() * this.length)] : null;
};

//Returns random (different) elements of the array.
//Fastest when you're going to end up selecting most of the array.
Array.prototype.samples = function <T>(count: number, _rng: Pick<RNG, 'random'> = rng): T[] {
  if (count <= 0 || this.length <= 0) return [];
  if (count >= this.length) return this.shuffled(_rng);
  const tempList = this.clone();
  while (tempList.length > count) tempList.removeAt(Math.floor(_rng.random() * tempList.length));
  return tempList;
};

// Fisher-Yates shuffle
// https://bost.ocks.org/mike/shuffle/
Array.prototype.shuffle = function <T>(_rng: Pick<RNG, 'random'> = rng): T[] {
  let j = this.length;
  let i = 0;
  while (j > 0) {
    i = Math.floor(_rng.random() * j);
    j--;
    this.swap(i, j);
  }
  return this;
};

//Returns a new array that is a shuffled version of the given array
Array.prototype.shuffled = function <T>(_rng: Pick<RNG, 'random'> = rng): T[] {
  const list = this.clone();
  list.shuffle(_rng);
  return list;
};

Array.prototype.flattened = function <T>(): T {
  return [].concat.apply([], this);
};

// Opposite of flattening an array; takes a one-dimensional array and cuts it into count-sized chunks, returning an array of arrays
Array.prototype.unflattened = function <T>(width: number): T[][] {
  if (width <= 0) throw `Cannot unflatten array using width ${width}`;
  const result: T[][] = [];
  for (let i = 0; i < this.length; i += width) result.push(this.slice(i, i + width));
  return result;
};
Array.prototype.batchify = Array.prototype.unflattened;

Array.prototype.any = function <T>(boolCheck: (o: T, i: number) => boolean): boolean {
  return this.some(boolCheck);
};

Array.prototype.all = function <T>(boolCheck: (o: T, i: number) => boolean): boolean {
  return !this.some((o: T, i: number) => !boolCheck(o, i));
};

Array.prototype.first = function <T>(boolCheck: ((o: T, i: number) => boolean) | null = null): T | null {
  if (boolCheck == null) {
    return this.length <= 0 ? null : this[0];
  }

  for (let i = 0; i < this.length; i++) {
    if (boolCheck(this[i], i)) return this[i];
  }
  return null;
};

Array.prototype.last = function <T>(boolCheck: ((o: T, i: number) => boolean) | null = null): T | null {
  if (boolCheck == null) {
    return this.length <= 0 ? null : this[this.length - 1];
  }

  for (let i = this.length - 1; i >= 0; i--) {
    if (boolCheck(this[i], i)) return this[i];
  }
  return null;
};

// AisBetterThanB = a function which takes two parameters and returns true if the first one is "better" than the second one, false otherwise.
// Returns the single element that won every comparison it was involved in (or null if the list is empty).
//
// Examples:
//
// Problem: I need the object with the highest score, or the first match if there's a tie
// [{score:5}, {id:'a', score:6}, {id:'b', score:6}, {score:3}]
//  .bestOf((a, b) => a.score > b.score)
//      = {id:'a', score:6}
// Note: alternative formulation = [{score:5}, {score:6}, {score:3}].maxOf(o => o.score)
//
// Problem: I need the object with the highest score, or the last match if there's a tie
// [{score:5}, {id:'a', score:6}, {id:'b', score:6}, {score:3}]
//  .bestOf((a, b) => a.score >= b.score)
//      = {id:'b', score:6}
//
// Problem: I need the character with the longest name who is still alive
// [
//     {name:'harry', alive:true},
//     {name:'ron', alive:true},
//     {name:'hermione', alive:true},
//     {name:'voldemort', alive:false}
// ].bestOf((a, b) => a.alive && a.name.length > b.name.length)
//     = {name:'hermione', alive:true}
//
// Problem: I need the object that is facing most upward
// [{direction: new Point(2, 6)}, {direction: new Point(-4, -3)}]
//  .bestOf((a, b) => a.direction.towardness(Point.up) > b.direction.towardness(Point.up))
//      = {direction: new Point(-4, -3)}
//
Array.prototype.bestOf = function <T>(AisBetterThanB: (a: T, b: T) => boolean): T | null {
  if (this.length === 0) return null;

  let bestItem = this[0];
  for (let item of this) if (AisBetterThanB(item, bestItem)) bestItem = item;
  return bestItem;
};

// Returns the element of the array with the lowest valueGetter(element) value
// Note: the first match is returned if there is a tie
Array.prototype.minOf = function <T>(valueGetter: (o: T) => number): T | null {
  return this.length > 0 ? this.bestOf((a: T, b: T) => valueGetter(a) < valueGetter(b)) : null;
};

// Returns the element of the array with the highest valueGetter(element) value
// Note: the first match is returned if there is a tie
Array.prototype.maxOf = function <T>(valueGetter: (o: T) => number): T | null {
  return this.length > 0 ? this.bestOf((a: T, b: T) => valueGetter(a) > valueGetter(b)) : null;
};

// Returns the lowest result of valueGetter when given each element in the array
Array.prototype.minValueOf = function <T>(valueGetter: (o: T) => number): number | null {
  if (this.length <= 0) return null;

  let bestValue = valueGetter(this[0]);
  for (let i = 1; i < this.length; i++) {
    const value = valueGetter(this[i]);
    if (value < bestValue) bestValue = value;
  }
  return bestValue;
};

// Returns the highest result of valueGetter when given each element in the array
Array.prototype.maxValueOf = function <T>(valueGetter: (o: T) => number): number | null {
  if (this.length <= 0) return null;

  let bestValue = valueGetter(this[0]);
  for (let i = 1; i < this.length; i++) {
    const value = valueGetter(this[i]);
    if (value > bestValue) bestValue = value;
  }
  return bestValue;
};

Array.prototype.sumOf = function <T>(valueGetter: (o: T) => number): number | null {
  return this.length > 0 ? this.reduce((total: number, element: T) => total + valueGetter(element), 0) : null;
};

Array.prototype.min = function (): number | null {
  return this.length > 0 ? this.minOf((o: number) => o) : null;
};
Array.prototype.max = function (): number | null {
  return this.length > 0 ? this.maxOf((o: number) => o) : null;
};
Array.prototype.sum = function (): number | null {
  return this.length > 0 ? this.reduce((total, increment) => total + increment) : null;
};

// Example:
// [
//      {name:'squirtle 1', type:'water'},
//      {name:'bulbasaur 1', type:'grass'},
//      {name:'bulbasaur 2', type:'grass'},
//      {name:'charmander', type:'fire'},
//      {name:'squirtle 2', type:'water'}
// ]
// .mappedBy(o => o.type)
//
// {
//      water: [{name:'squirtle 1', type:'water'},{name:'squirtle 2', type:'water'}],
//      grass: [{name:'bulbasaur 1', type:'grass'},{name:'bulbasaur 2', type:'grass'}],
//      fire: [{name:'charmander', type:'fire'}]
// }
Array.prototype.mappedBy = function <T>(keyGetter: (o: T) => string): {
  [key: string]: T[];
} {
  return this.reduce((obj: { [key: string]: T[] }, element: T) => {
    const key = keyGetter(element);
    if (!(key in obj)) obj[key] = [];
    obj[key].push(element);
    return obj;
  }, {});
};

// Same as Array.mappedBy except only the last element at each key is returned
// Best for circumstances where you're expecting the key value to be unique
Array.prototype.mappedByUnique = function <T>(keyGetter: (o: T) => string): {
  [key: string]: T;
} {
  return this.reduce((obj: { [key: string]: T }, element: T) => {
    const key = keyGetter(element);
    obj[key] = element;
    return obj;
  }, {});
};

Array.prototype.copy = function <T>(other: T[]) {
  this.splice(0, this.length, ...other);
};

Array.prototype.clone = function <T>(): T[] {
  return this.slice(0);
};

Array.prototype.clear = function <T>(): void {
  this.length = 0;
};

const existsFilter = (o: any) => o != null;
Array.prototype.exists = function <T>(): NonNullable<T>[] {
  return this.filter(existsFilter);
};

Array.prototype.orderBy = function <T>(getter: (a: T) => number): T[] {
  this.sort((a: T, b: T) => getter(a) - getter(b));
  return this;
};

// Returns the existing list but after removing all elements whose values are not unique as determined by the mapping function "valueGetter"
// (the first element with a given value is kept)
// Example:
// [
//     {id:0,n:1},
//     {id:1,n:2},
//     {id:2,n:1},
//     {id:3,n:3},
//     {id:4,n:2}
// ]
// .distinct(o => o.n) =
// [
//     {id:0,n:1},
//     {id:1,n:2},
//     {id:3,n:3}
// ]
Array.prototype.distinct = function <T>(valueGetter?: (o: T) => string | number): T[] {
  const values = this.map((o: T) => (valueGetter ? valueGetter(o) : o));
  this.removeWhere((o: T, i: number) => values.indexOf(valueGetter ? valueGetter(o) : o) !== i);
  return this;
};

// Returns a new list that has had .distinct() called
Array.prototype.distincted = function <T>(valueGetter?: (o: T) => string | number): T[] {
  const values = valueGetter ? this.map((o: T) => valueGetter(o)) : this;
  return this.filter((o: T, i: number) => values.indexOf(valueGetter ? valueGetter(o) : o) === i);
};
