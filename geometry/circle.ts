import { Point } from './point';

export class Circle extends Point { 
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y);
    }

    public collidesPoint(point: Point): boolean { return point.collidesCircle(this); }

    // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
    public static circumcircleOfPoints(points: Point[]): Circle {
        const center = Point.midpoint(points);
        const furthest = points.maxOf(o => o.distanceSqTo(center));
        const radius = furthest.distanceTo(center);
        return new Circle(center.x, center.y, radius);
    }
}