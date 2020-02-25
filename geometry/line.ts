import { Point } from './point';
import { IRay } from './ray';
import { ISegment } from './segment';

export enum PointPairType {
    LINE = "LINE",
    SEGMENT = "SEGMENT",
    RAY = "RAY"
}

export interface IPointPair {
    readonly a: Point,
    readonly b: Point
}
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

    constructor(public a: Point, public b: Point) {}

    public static yAtX(pair: ILine, x: number): number {
        const slope = Line.slope(pair);
        if(slope === Number.POSITIVE_INFINITY)
            return Number.POSITIVE_INFINITY;
        if(slope === Number.NEGATIVE_INFINITY)
            return Number.NEGATIVE_INFINITY;
        const xDiff = x - pair.a.x;
        return pair.a.y + xDiff * slope;
    }
    public static xAtY(pair: ILine, y: number): number {
        const slope = Line.slope(pair);
        if(slope === Number.POSITIVE_INFINITY)
            return pair.a.x;
        if(slope === Number.NEGATIVE_INFINITY)
            return pair.a.x;
        const yDiff = y - pair.a.y;
        return pair.a.x + yDiff / slope;
    }
    public yAtX(x: number): number { return Line.yAtX(this, x); }
    public xAtY(y: number): number { return Line.xAtY(this, y); }

    public static lineIntersection(a: ILine, b: ILine) { return Line.intersection(a, PointPairType.LINE, b, PointPairType.LINE); }
    public static rayIntersection(a: ILine, b: IRay) { return Line.intersection(a, PointPairType.LINE, b, PointPairType.RAY); }
    public static segmentIntersection(a: ILine, b: ISegment) { return Line.intersection(a, PointPairType.LINE, b, PointPairType.SEGMENT); }
    public static intersection(
        first: IPointPair, firstType: PointPairType, 
        second: IPointPair, secondType: PointPairType
    ): Point | null {
        const yFirstLineDiff = first.b.y - first.a.y;
        const xFirstLineDiff = first.a.x - first.b.x;
        const cFirst = first.b.x * first.a.y - first.a.x * first.b.y;
        const ySecondLineDiff = second.b.y - second.a.y;
        const xSecondLineDiff = second.a.x - second.b.x;
        const cSecond = second.b.x * second.a.y - second.a.x * second.b.y;

        const denominator = yFirstLineDiff * xSecondLineDiff - ySecondLineDiff * xFirstLineDiff;
        if (denominator === 0)
            return null;
        const intersectionPoint = new Point(
            (xFirstLineDiff * cSecond - xSecondLineDiff * cFirst) / denominator,
            (ySecondLineDiff * cFirst - yFirstLineDiff * cSecond) / denominator);

        const beyondFirstA = first.a.x === first.b.x
            ? Math.sign(intersectionPoint.y - first.a.y) !== Math.sign(first.b.y - first.a.y)
            : Math.sign(intersectionPoint.x - first.a.x) !== Math.sign(first.b.x - first.a.x);
        const beyondFirstB = first.a.x === first.b.x
            ? Math.sign(intersectionPoint.y - first.b.y) !== Math.sign(first.a.y - first.b.y)
            : Math.sign(intersectionPoint.x - first.b.x) !== Math.sign(first.a.x - first.b.x);
        const beyondFirst = beyondFirstA || beyondFirstB;

        const beyondSecondA = second.a.x === second.b.x
            ? Math.sign(intersectionPoint.y - second.a.y) !== Math.sign(second.b.y - second.a.y)
            : Math.sign(intersectionPoint.x - second.a.x) !== Math.sign(second.b.x - second.a.x);
        const beyondSecondB = second.a.x === second.b.x
            ? Math.sign(intersectionPoint.y - second.b.y) !== Math.sign(second.a.y - second.b.y)
            : Math.sign(intersectionPoint.x - second.b.x) !== Math.sign(second.a.x - second.b.x);
        const beyondSecond = beyondSecondA || beyondSecondB;

        return firstType === PointPairType.SEGMENT && beyondFirst
            || firstType === PointPairType.RAY && beyondFirstA
            || secondType === PointPairType.SEGMENT && beyondSecond
            || secondType === PointPairType.RAY && beyondSecondA
                ? null
                : intersectionPoint;
    };
}