export class Stack<T> {
    private readonly elements: T[] = [];
    constructor() {}

    public get length(): number { return this.elements.length; }
    public isEmpty(): boolean { return this.elements.length <= 0; }
    public pop(): T { return this.elements.pop(); };
    public push(item: T): void { this.elements.push(item); };
}