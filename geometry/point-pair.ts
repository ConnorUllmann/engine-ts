import { Point } from './point';
import { Rectangle, IRectangle } from './rectangle';
import { ITriangle, Triangle } from './triangle';

export enum PointPairType {
    LINE = "LINE",
    SEGMENT = "SEGMENT",
    RAY = "RAY"
}

export interface IPointPair {
    readonly a: Point,
    readonly b: Point
}

export class PointPair {
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
    
    public static rectangleIntersection(pair: IPointPair, pairType: PointPairType, rectangle: IRectangle): Point[] { 
        return Rectangle.segments(rectangle)
            .map(segment => PointPair.intersection(pair, pairType, segment, PointPairType.SEGMENT))
            .filter(point => point != null);
    }

    public static triangleIntersection(pair: IPointPair,  pairType: PointPairType, triangle: ITriangle): Point[] { 
        return Triangle.segments(triangle)
            .map(segment => PointPair.intersection(pair, pairType, segment, PointPairType.SEGMENT))
            .filter(point => point != null);
    }
}