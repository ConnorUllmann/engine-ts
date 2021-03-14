export class IdSet<U> extends Set<U> implements Iterable<U>, Set<U> {
    private dict: Record<string | number, U> = {} as Record<string | number, U>;

    // if keepFirstAdded is true, subsequent adds for the same id will not overwrite the current entry
    constructor(private readonly getId: ((u: U) => string) | ((u: U) => number), public keepFirstAdded: boolean=true) {
        super(null);
    }

    add(obj: U): this {
        const key = this.getId(obj);
        if(this.keepFirstAdded && key in this.dict)
            return this;
        this.dict[key] = obj;
        return this;
    }

    clear(): void {
        this.dict = {};
    }

    delete(obj: U): boolean {
        const id = this.getId(obj);
        if(id in this.dict) {
            delete this.dict[id];
            return true;
        }
        return false;
    }

    forEach(callbackfn: (obj: U, obj2: U, set: Set<U>) => void, thisArg?: any): void {
        for(let obj of this) {
            callbackfn(obj, obj, thisArg);
        }
    }

    has(obj: U): boolean {
        return this.getId(obj) in this.dict;
    }

    // TODO: track this value in add/delete/clear instead of by creating a new array so repeated accesses are less memory-intensive
    get size(): number {
        return Object.keys(this.dict).length;
    }

    keys(): IterableIterator<U> {
        return new IdSetIterator(this.dict);
    }

    values(): IterableIterator<U> {
        return new IdSetIterator(this.dict);
    }

    entries(): IterableIterator<[U, U]> {
        return new IdSetEntriesIterator(this.dict);
    }

    [Symbol.iterator](): IterableIterator<U> {
        return new IdSetIterator(this.dict);
    }

    get [Symbol.toStringTag]() {
        return 'IdSet';
    }
}

class IdSetIterator<T extends string | number, U> implements IterableIterator<U> {
    private index: number;
    private readonly values: U[];
    constructor(dict: Record<T, U>) {
        this.values = Object.values(dict);
        this.index = 0;
    }

    public next(): IteratorResult<U> {
        return this.index < this.values.length
            ? {
                done: false,
                value: this.values[this.index++]
            }
            : {
                done: true,
                value: null
            };
    }

    [Symbol.iterator](): IterableIterator<U> {
        return this;
    }
}

class IdSetEntriesIterator<T extends string | number, U> implements IterableIterator<[U, U]> {
    private index: number;
    private readonly values: U[];
    constructor(dict: Record<T, U>) {
        this.values = Object.values(dict);
        this.index = 0;
    }

    public next(): IteratorResult<[U, U]> {
        if(this.index >= this.values.length)
            return { done: true, value: null };
        const value = this.values[this.index++];
        return {
            done: false,
            value: [value, value]
        };
    }

    [Symbol.iterator](): IterableIterator<[U, U]> {
        return this;
    }
}