import { RNG } from '../core/rng';
import { rng } from '../core/utils';

interface Weightable<T> {
  value: T;
  weight: number;
}

export type WeightRangeConstructorParameters<T> = Weightable<T>[];

// TODO use bounds function to get index
export class WeightRange<T> {
  private weightTotal: number = 0;
  private readonly _range: Weightable<T>[];
  public get range(): ReadonlyArray<Weightable<T> & { readonly weight: number }> {
    return this._range;
  }

  constructor(...range: WeightRangeConstructorParameters<T>) {
    this._range = range;
    this.resetWeightTotal();
  }

  private resetWeightTotal() {
    this.weightTotal = 0;
    for (let i = 0; i < this._range.length; i++) {
      this.weightTotal += this._range[i].weight;
    }
  }

  public setWeight(index: number, newWeight: number) {
    if (index < 0 || index >= this._range.length) return;
    this._range[index].weight = newWeight;
    this.resetWeightTotal();
  }

  public resetWeights(getNewWeight: (current: { value: T; weight: number }, index: number) => number) {
    for (let i = 0; i < this._range.length; i++) this._range[i].weight = getNewWeight(this._range[i], i);
    this.resetWeightTotal();
  }

  public add(value: T, weight: number) {
    this._range.push({ value, weight });
    this.resetWeightTotal();
  }

  public addMultiple(...range: { value: T; weight: number }[]) {
    this._range.push(...range);
    this.resetWeightTotal();
  }

  /**
   * @param normal A value [0, 1]
   * @returns The index from the list of entries whose weight range includes the given normal value.
   * @example
   * ```typescript
   * const range = new WeightRange(
   *   { value: 'a', weight: 2 },
   *   { value: 'b', weight: 3 },
   * )
   * const index = range.index(0.7);
   * // index === 1
   * // This is because 'b' owns the range [0.4, 1], and it is at index 1.
   * ```
   */
  public index(normal: number): number | null {
    if (this._range.length <= 0 || this.weightTotal <= 0) return null;
    if (normal > 1) return this._range.length - 1;
    let weight = 0;
    for (let i = 0; i < this._range.length; i++) {
      weight += this._range[i].weight;
      if (normal < weight / this.weightTotal) return i;
    }
    return this._range.length - 1;
  }

  /**
   * @param normal A value [0, 1] to evaluate against the full range
   * @returns The value [0, 1] of progress into the section of the range covered by the value at the normal
   * @example
   * ```typescript
   * const range = new WeightRange(
   *   { value: 'a', weight: 2 },
   *   { value: 'b', weight 3 },
   * )
   * const valueNormal = range.valueNormal(0.3);
   * // valueNormal === 0.75
   * // This is because 'a' owns the range [0, 0.4), and the normal was 0.3
   * // which is 3/4 of the way done with the range owned by 'a'
   * ```
   */
  public valueNormal(normal: number): number | null {
    if (this._range.length <= 0 || this.weightTotal <= 0) return null;
    if (normal > 1) return 1;
    let weight = 0;
    for (let i = 0; i < this._range.length; i++) {
      const weightLowerBound = weight / this.weightTotal;
      weight += this._range[i].weight;
      const weightUpperBound = weight / this.weightTotal;
      if (normal < weightUpperBound) {
        const denom = weightUpperBound - weightLowerBound;
        return Math.abs(denom) <= 0 ? 0 : (Math.max(normal, 0) - weightLowerBound) / denom;
      }
    }
    return 1;
  }

  /**
   * @param normal A value [0, 1] to evaluate against the full range
   * @param index A zero-based index for the list of weighted entries in the range
   * @returns The value [0, 1] of progress into the section of the range covered by the value at the index given the normal.
   * @example
   * ```typescript
   * const range = new WeightRange(
   *   { value: 'a', weight: 2 },
   *   { value: 'b', weight 3 },
   * )
   * const valueNormal = range.valueNormalForIndex(0.3, 1);
   * // valueNormal === 0
   * // This is because the index 1 maps to 'b' which owns the range [0.4, 1]. 0.3 is below this range,
   * // so the valueNormal of 'b' is 0 (as it hasn't been reached yet).
   * ```
   */
  public valueNormalForIndex(normal: number, index: number): number | null {
    const indexForNormal = this.index(normal);
    return indexForNormal === index
      ? this.valueNormal(normal)
      : indexForNormal == null
      ? 0
      : indexForNormal < index
      ? 0
      : 1;
  }

  /**
   * Given an index of the range, returns the upper bound normal of the range owned by the value at that index.
   * @param index A zero-based index for the list of weighted entries in the range.
   * @returns A value [0, 1] of the lower bound of the element at the given index.
   * @example
   * ```typescript
   * const range = new WeightRange(
   *   { value: 'a', weight: 2 },
   *   { value: 'b', weight: 3 },
   * )
   * const normal = range.normalLowerBound(1);
   * // normal === 0.4
   * // This is because 'b' is at index 1, and 'b' owns the range [0.4, 1], which has an upper bound of 1
   * ```
   */
  public normalLowerBound(index: number) {
    let weight = 0;
    for (let i = 0; i < this._range.length; i++) {
      if (i == index) return weight / this.weightTotal;
      weight += this._range[i].weight;
    }
    return 1;
  }

  /**
   * Given an index of the range, returns the upper bound normal of the range owned by the value at that index.
   * @param index A zero-based index for the list of weighted entries in the range.
   * @returns A value [0, 1] of the upper bound of the element at the given index.
   * @example
   * ```typescript
   * const range = new WeightRange(
   *   { value: 'a', weight: 2 },
   *   { value: 'b', weight: 3 },
   * )
   * const normal = range.normalUpperBound(0);
   * // normal === 0.4
   * // This is because 'a' is at index 0, and 'a' owns the range [0, 0.4), which has an upper bound of 0.4
   * ```
   */
  public normalUpperBound(index: number) {
    let weight = 0;
    for (let i = 0; i < this._range.length; i++) {
      weight += this._range[i].weight;
      if (i == index) return weight / this.weightTotal;
    }
    return 1;
  }

  /**
   * @param normal A value [0, 1]
   * @returns The value from the range whose weight range includes the given normal value.
   * @example
   * ```typescript
   * const range = new WeightRange(
   *   { value: 'a', weight: 2 },
   *   { value: 'b', weight: 3 },
   * )
   * const value = range.value(0.7);
   * // value === 'b'
   * // This is because 'b' owns the range [0.4, 1], and 0.7 is in that range.
   * ```
   */
  public value(normal: number): T | null {
    const index = this.index(normal);
    return index != null ? this._range[index].value : null;
  }

  /**
   * @returns A random entry in the weighted range where each element's probability is proportional to its weight.
   */
  public sample(_rng: RNG = rng): T | null {
    return this.value(_rng.random());
  }
}
