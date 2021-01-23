import { random } from "@engine-ts/core/utils";

// TODO use bounds function to get index
export class WeightRange<T> {
    private readonly weightTotal: number;
    public readonly range: ReadonlyArray<{ value: T, weight: Readonly<number> }>;

    constructor(...range: { value: T, weight: number }[]) {
        this.weightTotal = range.sumOf(o => o.weight);
        this.range = range;
    }

    public index(normal: number): number | null {
        if(this.range.length <= 0 || this.weightTotal <= 0)
            return null;
        if(normal > 1)
            return this.range.length-1;        
        let timeWeight = 0;
        for(let i = 0; i < this.range.length; i++) {
            timeWeight += this.range[i].weight;
            if(normal <= timeWeight / this.weightTotal)
                return i;
        }
        return this.range.length-1;
    }

    public value(normal: number): T | null {
        const index = this.index(normal)
        return index != null ? this.range[index].value : null;
    }

    public sample(): T | null {
        return this.value(random());
    }
}