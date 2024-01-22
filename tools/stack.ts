export class Stack<T> {
  constructor(public readonly elements: T[] = []) {}

  public get length(): number {
    return this.elements.length;
  }
  public isEmpty(): boolean {
    return this.elements.length <= 0;
  }
  public pop(): T | null {
    return this.elements.pop() ?? null;
  }
  public push(item: T): void {
    this.elements.push(item);
  }
  public clear(): void {
    this.elements.clear();
  }
  public get top(): T | null {
    return this.elements.last();
  }
}
