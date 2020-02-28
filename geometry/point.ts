import { Rectangle } from './rectangle';
import { Circle } from './circle';
import { distanceSq, distance, random, clamp } from '../core/utils';
import { Triangle } from './triangle';
import { IPointPair } from './point-pair';

export interface IPoint {
    readonly x: number;
    readonly y: number;
}
export class Point implements IPoint {
    private static _zero: ConstPoint;
    public static get zero(): ConstPoint { return Point._zero; }
    private static _one: ConstPoint;
    public static get one(): ConstPoint { return Point._one; }
    private static _north: ConstPoint;
    public static get north(): ConstPoint { return Point._north; }
    private static _up: ConstPoint;
    public static get up(): ConstPoint { return Point._up; }
    private static _northWest: ConstPoint;
    public static get northWest(): ConstPoint { return Point._northWest; }
    private static _upLeft: ConstPoint;
    public static get upLeft(): ConstPoint { return Point._upLeft; }
    private static _northEast: ConstPoint;
    public static get northEast(): ConstPoint { return Point._northEast; }
    private static _upRight: ConstPoint;
    public static get upRight(): ConstPoint { return Point._upRight; }
    private static _south: ConstPoint;
    public static get south(): ConstPoint { return Point._south; }
    private static _down: ConstPoint;
    public static get down(): ConstPoint { return Point._down; }
    private static _southWest: ConstPoint;
    public static get southWest(): ConstPoint { return Point._southWest; }
    private static _downLeft: ConstPoint;
    public static get downLeft(): ConstPoint { return Point._downLeft; }
    private static _southEast: ConstPoint;
    public static get southEast(): ConstPoint { return Point._southEast; }
    private static _downRight: ConstPoint;
    public static get downRight(): ConstPoint { return Point._downRight; }
    private static _west: ConstPoint;
    public static get west(): ConstPoint { return Point._west; }
    private static _left: ConstPoint;
    public static get left(): ConstPoint { return Point._left; }
    private static _east: ConstPoint;
    public static get east(): ConstPoint { return Point._east; }
    private static _right: ConstPoint;
    public static get right(): ConstPoint { return Point._right; }

    public static start(): void {
        Point._zero = new ConstPoint(0, 0);
        Point._one = new ConstPoint(1, 1);
        Point._north = Point._up = new ConstPoint(0, -1);
        Point._northWest = Point._upLeft = new ConstPoint(-1, -1);
        Point._northEast = Point._upRight = new ConstPoint(1, -1);
        Point._south = Point._down = new ConstPoint(0, 1);
        Point._southWest = Point._downLeft = new ConstPoint(-1, 1);
        Point._southEast = Point._downRight = new ConstPoint(1, 1);
        Point._west = Point._left = new ConstPoint(-1, 0);
        Point._east = Point._right = new ConstPoint(1, 0);
    }

    protected _x: number;
    protected _y: number;

    public get x(): number { return this._x; }
    public get y(): number { return this._y; }

    public set x(x: number) { this._x = x; }
    public set y(y: number) { this._y = y; }

    constructor(x: number=0, y: number=0) {
        this._x = x;
        this._y = y;
    }

    public static create(length: number, angle: number): Point { return new Point(Math.cos(angle) * length, Math.sin(angle) * length); }

    public clonePoint(): Point { return new Point(this.x, this.y); }
    public toString(): string { return JSON.stringify({ x: this.x.toFixed(1), y: this.y.toFixed(1) }); }

    public setTo(b: IPoint): Point { this.x = b.x; this.y = b.y; return this; }
    public lengthSq(): number { return this.x * this.x + this.y * this.y; }
    public dot(b: IPoint): number { return this.x * b.x + this.y * b.y; }
    public cross(b: IPoint): number { return this.x * b.y - b.x * this.y; }
    public add(b: IPoint): Point { return new Point(this.x + b.x, this.y + b.y); }
    public subtract(b: IPoint): Point { return new Point(this.x - b.x, this.y - b.y); }
    public proj(b: Point): Point { return b.scale(this.dot(b) / Math.max(b.lengthSq(), 0.000001)); }
    public normalized(length: number=1): Point {
        if((this.x === 0 && this.y === 0) || length === 0)
            return new Point();
        let temp = length / Math.sqrt(this.lengthSq());
        return new Point(this.x * temp, this.y * temp);
    }

    // if "scalar" is a number, then a new point scaled on both x/y by that amount will be returned.
    // if "scalar" is a point, then a new point scaled on both x/y by scalar's x/y will be returned.
    public scale(scalar: number | Point): Point {
        return scalar instanceof Point
            ? new Point(this.x * scalar.x, this.y * scalar.y)
            : new Point(this.x * scalar, this.y * scalar)
    }

    public midpoint(...points: IPoint[]): Point { return Point.midpoint([ this, ...points ])!; }
    public static midpoint(points: IPoint[]): Point | null {
        if(points == null || points.length <= 0)
            return null;
        const sum = new Point();
        points.forEach(point => { sum.x += point.x; sum.y += point.y; });
        return sum.scale(1/points.length);
    }
    public distanceSqTo(b: IPoint): number { return distanceSq(this.x, this.y, b.x, b.y); }
    public distanceTo(b: IPoint): number { return distance(this.x, this.y, b.x, b.y); }

    // radians!
    public get angle(): number { return Math.atan2(this.y, this.x); };

    public reflect(normal: Point, origin: Point | null=null): Point {
        if(origin == null)
        {
            const reflectionPoint = this.closestPointOnLine({ a: Point.zero, b: normal });
            return reflectionPoint.subtract(this).scale(2).add(this);
        }

        const reflectionPoint = this.closestPointOnLine({ a: origin, b: origin.add(normal) });
        return reflectionPoint.subtract(this).scale(2).add(this);
    }

    // if result is > 0, then this point is left of the line/segment/ray formed by the two points.
    // if result is < 0, then this point is right of the line/segment/ray formed by the two points. 
    // if result == 0, then it is colinear with the two points.
    public isLeftCenterRightOf({ a, b }: IPointPair): number { return Math.sign((b.x - a.x) * (this.y - a.y) - (b.y - a.y) * (this.x - a.x)); }
    public isLeftOf(pair: IPointPair): boolean { return this.isLeftCenterRightOf(pair) > 0; }
    public isColinear(pair: IPointPair): boolean { return Point.isWithinToleranceOf(this.isLeftCenterRightOf(pair)); }
    public isRightOf(pair: IPointPair): boolean { return this.isLeftCenterRightOf(pair) < 0; }

    public closestPointOnLine({ a, b }: IPointPair): Point { return this.subtract(a).proj(b.subtract(a)).add(a); };
    public closestPointOnLineSegment({ a, b }: IPointPair): Point {
        const ab = b.subtract(a);
        const ret = this.subtract(a).proj(ab).add(a);
        const r = ret.subtract(a).dot(ab);
        if(r < 0) return a;
        if(r > ab.lengthSq()) return b;
        return ret;
    }

    public collidesRectangle(rectangle: Rectangle): boolean { return rectangle.collidesPoint(this); }
    public collidesCircle(circle: Circle): boolean { return circle.collidesPoint(this); }
    public collidesTriangle(triangle: Triangle): boolean { return triangle.collidesPoint(this); }

    // Returns how much this point (as a vector) faces in the direction of the given point (as a vector)
    // -1 = this point faces opposite the direction of argument "point"
    // 0 = this point faces perpendicular to the direction of argument "point"
    // 1 = this point faces the exact same direction as argument "point"
    public towardness(point: Point): number { return this.normalized().dot(point.normalized()); }

    // t = 0 = this point
    // t = 0.5 = midpoint between this point and the argument "point:
    // t = 1 = the argument "point"
    public lerp(point: IPoint, t: number): Point { return new Point((point.x - this.x) * t + this.x, (point.y - this.y) * t + this.y); };


    public static linesIntersection(firstLineA: IPoint, firstLineB: IPoint, secondLineA: IPoint, secondLineB: IPoint, isFirstSegment: boolean = true, isSecondSegment: boolean = true): Point | null {
        const yFirstLineDiff = firstLineB.y - firstLineA.y;
        const xFirstLineDiff = firstLineA.x - firstLineB.x;
        const cFirst = firstLineB.x * firstLineA.y - firstLineA.x * firstLineB.y;
        const ySecondLineDiff = secondLineB.y - secondLineA.y;
        const xSecondLineDiff = secondLineA.x - secondLineB.x;
        const cSecond = secondLineB.x * secondLineA.y - secondLineA.x * secondLineB.y;

        const denominator = yFirstLineDiff * xSecondLineDiff - ySecondLineDiff * xFirstLineDiff;
        if (denominator === 0)
            return null;
        const intersectionPoint = new Point(
            (xFirstLineDiff * cSecond - xSecondLineDiff * cFirst) / denominator,
            (ySecondLineDiff * cFirst - yFirstLineDiff * cSecond) / denominator);
        return (isFirstSegment && (
                Math.pow(intersectionPoint.x - firstLineB.x, 2) + Math.pow(intersectionPoint.y - firstLineB.y, 2) > Math.pow(firstLineA.x - firstLineB.x, 2) + Math.pow(firstLineA.y - firstLineB.y, 2) ||
                Math.pow(intersectionPoint.x - firstLineA.x, 2) + Math.pow(intersectionPoint.y - firstLineA.y, 2) > Math.pow(firstLineA.x - firstLineB.x, 2) + Math.pow(firstLineA.y - firstLineB.y, 2)
            ))
            ||
            (isSecondSegment && (
                Math.pow(intersectionPoint.x - secondLineB.x, 2) + Math.pow(intersectionPoint.y - secondLineB.y, 2) > Math.pow(secondLineA.x - secondLineB.x, 2) + Math.pow(secondLineA.y - secondLineB.y, 2) ||
                Math.pow(intersectionPoint.x - secondLineA.x, 2) + Math.pow(intersectionPoint.y - secondLineA.y, 2) > Math.pow(secondLineA.x - secondLineB.x, 2) + Math.pow(secondLineA.y - secondLineB.y, 2)
            ))
            ? null
            : intersectionPoint;
    };

    public closest(points: IPoint[]): IPoint { return points.minOf(o => this.distanceSqTo(o)); }

    public rotated(angle: number, center: Point | null=null): Point {
        const x = this.x - (center ? center.x : 0);
        const y = this.y - (center ? center.y : 0);
        return new Point(
            (center ? center.x : 0) + x * Math.cos(angle) - y * Math.sin(angle),
            (center ? center.y : 0) + y * Math.cos(angle) + x * Math.sin(angle)
        );
    }

    // rotates the point randomly in the range given (about the origin)
    public wiggle(angleRangeMax: number): Point { return this.rotated(angleRangeMax * (random() - 0.5)); }

    // same as rotating a vector 180 degrees
    public negative(): Point { return new Point(-this.x, -this.y); }

    // returns a version of this point which is flipped over (rotated 180 degrees around) the given point
    // (or the origin if none is provided). Provided because it is faster than using rotate/reflect.
    public flip(center: IPoint | null=null): Point { return center == null ? this.negative() : new Point(2 * center.x - this.x, 2 * center.y - this.y); }

    public clampedInRectangle(rectangle: Rectangle): Point { return new Point(clamp(this.x, rectangle.xLeft, rectangle.xRight), clamp(this.y, rectangle.yTop, rectangle.yBottom)); }
    
    private static _tolerance: number = 0.00000001;
    public static isWithinToleranceOf(a: number, b: number=0): boolean { return Math.abs(a - b) < Point._tolerance; }
    public isEqualTo(b: IPoint): boolean { return Point.isWithinToleranceOf(this.distanceSqTo(b)); }
    public get hash(): string { return `${this.x.toFixed(6)},${this.y.toFixed(6)}`; }
}

class ConstPoint extends Point {
    public get x(): number { return this._x; }
    public get y(): number { return this._y; }

    public set x(x: number) { throw 'Cannot set \'x\' property of a ConstPoint'; }
    public set y(y: number) { throw 'Cannot set \'y\' property of a ConstPoint'; }
}

Point.start();