export class Stack<T> {
    public readonly elements: T[] = [];
    constructor() {}

    public get length(): number { return this.elements.length; }
    public isEmpty(): boolean { return this.elements.length <= 0; }
    public pop(): T | null { return this.elements.pop() ?? null; }
    public push(item: T): void { this.elements.push(item); }
    public get top(): T | null { return this.elements.last(); }
}