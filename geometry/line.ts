import { Point } from './point';
import { IRay } from './ray';
import { ISegment } from './segment';
import { IRectangle } from './rectangle';
import { IPointPair, PointPairType, PointPair } from './point-pair';
import { ITriangle } from './triangle';

export interface ILine extends IPointPair {}
export class Line implements ILine {
    public static hash(line: ILine): string { return `${Line.slope(line).toFixed(6)}${Line.yAtX(line, 0).toFixed(6)}`; }
    public get hash(): string { return Line.hash(this); }
    public static areEqual(a: ILine, b: ILine): boolean { return Line.hash(a) === Line.hash(b); }
    public isEqualTo(line: ILine): boolean { return Line.areEqual(this, line); }
    public static slope(pair: IPointPair): number { 
        return pair.b.x !== pair.a.x 
            ? (pair.b.y - pair.a.y) / (pair.b.x - pair.a.x) 
            : (pair.b.y > pair.a.y 
                ? Number.NEGATIVE_INFINITY 
                : Number.POSITIVE_INFINITY);
    }
    public get slope(): number { return Line.slope(this); }
    public static yAtX(pair: ILine, x: number): number {
        const slope = Line.slope(pair);
        if(slope === Number.POSITIVE_INFINITY)
            return Number.POSITIVE_INFINITY;
        if(slope === Number.NEGATIVE_INFINITY)
            return Number.NEGATIVE_INFINITY;
        const xDiff = x - pair.a.x;
        return pair.a.y + xDiff * slope;
    }
    public yAtX(x: number): number { return Line.yAtX(this, x); }
    public static xAtY(pair: ILine, y: number): number {
        const slope = Line.slope(pair);
        if(slope === Number.POSITIVE_INFINITY)
            return pair.a.x;
        if(slope === Number.NEGATIVE_INFINITY)
            return pair.a.x;
        const yDiff = y - pair.a.y;
        return pair.a.x + yDiff / slope;
    }
    public xAtY(y: number): number { return Line.xAtY(this, y); }
    public lineIntersection(line: ILine): Point | null { return PointPair.intersection(this, PointPairType.LINE, line, PointPairType.LINE); }
    public rayIntersection(ray: IRay): Point | null { return PointPair.intersection(this, PointPairType.LINE, ray, PointPairType.RAY); }
    public segmentIntersection(segment: ISegment): Point | null { return PointPair.intersection(this, PointPairType.LINE, segment, PointPairType.SEGMENT); }
    public rectangleIntersection(rectangle: IRectangle): Point[] { return PointPair.rectangleIntersection(this, PointPairType.LINE, rectangle); }
    public triangleIntersection(triangle: ITriangle): Point[] { return PointPair.triangleIntersection(this, PointPairType.LINE, triangle); }

    constructor(public a: Point, public b: Point) {}
}