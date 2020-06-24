export class Heap<T> {
    private readonly elements: T[] = [];

    constructor(private readonly compare: (a: T, b: T) => number, private readonly min=true) {}
    
    public get length(): number { return this.elements.length; }
    public contains(element: T): boolean { return this.elements.includes(element) };
    public isEmpty(): boolean { return this.elements.length === 0; };
    public top(): T | null { return this.isEmpty() ? null : this.elements.first(); };
    
    public add(element: T): void {
        this.elements.push(element);
        this.fix();
    };
    
    public addRange(elements: T[]): void {
        this.elements.push(...elements);
        this.fix();
    };
    
    public deleteAt(index: number): void {
        if(this.isEmpty())
            return;
    
        const element = this.elements.pop();
        if(this.isEmpty())
            return;
        this.elements[index] = element;
        this.fix();
    };
        
    public pop(): T | null {
        const element = this.elements.first();
        this.deleteAt(0);
        return element;
    };
    
    private fix(): void {
        for(let i = this.elements.length - 1; i > 0; i--) {
            let parentIndex = Math.floor(Math.max(0, (i+1)/2-1));
            let result = this.compare(this.elements[parentIndex], this.elements[i]);
            if((this.min ? result : -result) > 0)
                this.elements.swap(parentIndex, i);
        }
    };
}
