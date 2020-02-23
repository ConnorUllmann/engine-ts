import { Point } from './point';

export class Segment {
    constructor(public a: Point, public b: Point) {}

    public get vertices(): Point[] { return [this.a, this.b]; }
    public get hash(): string { return this.vertices.sorted().map(o => o.hash).join('|'); }
    public isEqualTo(segment: Segment): boolean { return segment.hash === this.hash; }
    public get midpoint(): Point { return this.a.midpoint(this.b); }
}