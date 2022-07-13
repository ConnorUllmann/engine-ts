import { RNG } from '../core/rng';
import { rng } from '../core/utils';

interface Weightable<T> {
  value: T;
  weight: number;
}

export type WeightRangeConstructorParameters<T> = Weightable<T>[];

// TODO use bounds function to get index
export class WeightRange<T> {
  private weightTotal: number;
  private readonly _range: Weightable<T>[];
  public get range(): ReadonlyArray<Weightable<T> & { readonly weight: number }> {
    return this._range;
  }

  constructor(...range: WeightRangeConstructorParameters<T>) {
    this._range = range;
    this.resetWeightTotal();
  }

  private resetWeightTotal() {
    this.weightTotal = this._range.sumOf(o => o.weight) ?? 0;
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

  public index(normal: number): number | null {
    if (this._range.length <= 0 || this.weightTotal <= 0) return null;
    if (normal > 1) return this._range.length - 1;
    let weight = 0;
    for (let i = 0; i < this._range.length; i++) {
      weight += this._range[i].weight;
      if (normal <= weight / this.weightTotal) return i;
    }
    return this._range.length - 1;
  }

  // the weight (normalized) at which the given index ends
  // roughly inverse operation of WeightRange.index
  public normal(index: number) {
    let weight = 0;
    for (let i = 0; i < this._range.length; i++) {
      weight += this._range[i].weight;
      if (i == index) return weight / this.weightTotal;
    }
    return 1;
  }

  public value(normal: number): T | null {
    const index = this.index(normal);
    return index != null ? this._range[index].value : null;
  }

  public sample(_rng?: RNG): T | null {
    return this.value((_rng ?? rng).random());
  }
}
