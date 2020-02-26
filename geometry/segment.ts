import { Point } from './point';
import { Line, ILine } from './line';
import { IPointPair, PointPairType, PointPair } from './point-pair';
import { IRay } from './ray';
import { IRectangle } from './rectangle';
import { ITriangle } from './triangle';

export interface ISegment extends IPointPair {}
export class Segment implements ISegment {
    public static vertices(segment: ISegment): Point[] { return [segment.a, segment.b]; }
    public vertices(): Point[] { return Segment.vertices(this); }
    public static hash(segment: ISegment): string { return Segment.vertices(segment).sorted().map(o => o.hash).join('|'); }
    public get hash(): string { return Segment.hash(this); }
    public static areEqual(a: ISegment, b: ISegment): boolean { return Segment.hash(a) === Segment.hash(b); }
    public isEqualTo(segment: ISegment): boolean { return Segment.areEqual(this, segment); }
    public get midpoint(): Point { return this.a.midpoint(this.b); }
    public static slope(segment: ISegment): number { return Line.slope(segment); }
    public get slope(): number { return Line.slope(this); }
    public static yAtX(segment: ISegment, x: number): number | null { 
        return Math.sign(x - segment.a.x) * Math.sign(segment.b.x - segment.a.x) === -1 
            && Math.sign(x - segment.b.x) * Math.sign(segment.a.x - segment.b.x) === -1
                ? Line.yAtX(segment, x)
                : null;
    }
    public yAtX(x: number): number { return Segment.yAtX(this, x); }
    public static xAtY(segment: ISegment, y: number): number | null { 
        return Math.sign(y - segment.a.y) * Math.sign(segment.b.y - segment.a.y) === -1
            && Math.sign(y - segment.b.y) * Math.sign(segment.a.y - segment.b.y) === -1
                ? Line.xAtY(segment, y) 
                : null;
    }
    public xAtY(y: number): number { return Segment.xAtY(this, y); }
    public lineIntersection(line: ILine): Point | null { return PointPair.intersection(this, PointPairType.SEGMENT, line, PointPairType.LINE); }
    public rayIntersection(ray: IRay): Point | null { return PointPair.intersection(this, PointPairType.SEGMENT, ray, PointPairType.RAY); }
    public segmentIntersection(segment: ISegment): Point | null { return PointPair.intersection(this, PointPairType.SEGMENT, segment, PointPairType.SEGMENT); }
    public rectangleIntersection(rectangle: IRectangle): Point[] { return PointPair.rectangleIntersection(this, PointPairType.SEGMENT, rectangle); }
    public triangleIntersection(triangle: ITriangle): Point[] { return PointPair.triangleIntersection(this, PointPairType.SEGMENT, triangle); }

    constructor(public a: Point, public b: Point) {}

    
}