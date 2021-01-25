import { random } from "@engine-ts/core/utils";

// TODO use bounds function to get index
export class WeightRange<T> {
    private weightTotal: number;
    private readonly _range: { value: T, weight: number }[];
    public get range(): ReadonlyArray<{ value: T, readonly weight: number }> { return this._range; }

    constructor(...range: { value: T, weight: number }[]) {
        this._range = range;
        this.resetWeightTotal();
    }

    private resetWeightTotal() {
        this.weightTotal = this._range.sumOf(o => o.weight);
    }

    public setWeight(index: number, newWeight: number) {
        if(index < 0 || index >= this._range.length)
            return;
        this._range[index].weight = newWeight;
        this.resetWeightTotal();
    }

    public resetWeights(getNewWeight: (current: { value: T, weight: number }, index: number) => number) {
        for(let i = 0; i < this._range.length; i++)
            this._range[i].weight = getNewWeight(this._range[i], i);
        this.resetWeightTotal();
    }

    public add(value: T, weight: number) {
        this._range.push({ value, weight });
        this.resetWeightTotal();
    }

    public addMultiple(...range: { value: T, weight: number }[]) {
        this._range.push(...range);
        this.resetWeightTotal();
    }

    public index(normal: number): number | null {
        if(this._range.length <= 0 || this.weightTotal <= 0)
            return null;
        if(normal > 1)
            return this._range.length-1;        
        let timeWeight = 0;
        for(let i = 0; i < this._range.length; i++) {
            timeWeight += this._range[i].weight;
            if(normal <= timeWeight / this.weightTotal)
                return i;
        }
        return this._range.length-1;
    }

    public value(normal: number): T | null {
        const index = this.index(normal)
        return index != null ? this._range[index].value : null;
    }

    public sample(): T | null {
        return this.value(random());
    }
}