import { Point, IPoint } from './point';
import { distanceSq } from '@engine-ts/core/utils';
import { Rectangle } from './rectangle';

export interface ICircle extends IPoint {
    radius: number
}
export class Circle extends Point implements ICircle { 
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y);
    }

    public get diameter(): number { return this.radius * 2; }
    public collidesPoint(point: Point): boolean { return distanceSq(point.x, point.y, this.x, this.y) <= this.radius * this.radius; }
    public collidesRectangle(rectangle: Rectangle): boolean { return rectangle.collidesCircle(this); }

    // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
    public static circumcircleOfPoints(points: Point[]): Circle {
        const center = Point.midpoint(points);
        const furthest = points.maxOf(o => o.distanceSqTo(center));
        const radius = furthest.distanceTo(center);
        return new Circle(center.x, center.y, radius);
    }
}