import { Point, IPoint } from './point';
import { distanceSq, tau } from '@engine-ts/core/utils';
import { Rectangle, IRectangle } from './rectangle';

export interface ICircle extends IPoint {
    readonly radius: number
}
export class Circle extends Point implements ICircle { 
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y);
    }

    public get circumference(): number { return tau * this.radius; }
    public get area(): number { return Math.PI * this.radius * this.radius; }
    public get diameter(): number { return this.radius * 2; }
    public collidesPoint(point: IPoint): boolean { return distanceSq(point.x, point.y, this.x, this.y) <= this.radius * this.radius; }
    public collidesRectangle(rectangle: IRectangle): boolean { return Rectangle.collidesCircle(rectangle, this); }

    // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
    public static circumcircleOfPoints(points: IPoint[]): Circle {
        const center = Point.midpoint(points);
        const furthest = points.maxOf(o => center.distanceSqTo(o));
        const radius = center.distanceTo(furthest);
        return new Circle(center.x, center.y, radius);
    }
}