import { Point } from './point';
import { IPointPair, Line } from './line';

export interface ISegment extends IPointPair {}
export class Segment implements ISegment {
    public static vertices(segment: ISegment): Point[] { return [segment.a, segment.b]; }
    public get vertices(): Point[] { return Segment.vertices(this); }
    public static hash(segment: ISegment): string { return Segment.vertices(segment).sorted().map(o => o.hash).join('|'); }
    public get hash(): string { return Segment.hash(this); }
    public static areEqual(a: ISegment, b: ISegment): boolean { return Segment.hash(a) === Segment.hash(b); }
    public isEqualTo(segment: ISegment): boolean { return Segment.areEqual(this, segment); }
    public get midpoint(): Point { return this.a.midpoint(this.b); }
    public static slope(segment: ISegment): number { return Line.slope(segment); }
    public get slope(): number { return Line.slope(this); }

    constructor(public a: Point, public b: Point) {}

    public static yAtX(segment: ISegment, x: number): number | null { 
        return Math.sign(x - segment.a.x) * Math.sign(segment.b.x - segment.a.x) === -1 
            && Math.sign(x - segment.b.x) * Math.sign(segment.a.x - segment.b.x) === -1
                ? Line.yAtX(segment, x)
                : null;
    }
    public static xAtY(segment: ISegment, y: number): number | null { 
        return Math.sign(y - segment.a.y) * Math.sign(segment.b.y - segment.a.y) === -1
            && Math.sign(y - segment.b.y) * Math.sign(segment.a.y - segment.b.y) === -1
                ? Line.xAtY(segment, y) 
                : null;
    }
    public yAtX(x: number): number { return Segment.yAtX(this, x); }
    public xAtY(y: number): number { return Segment.xAtY(this, y); }
}