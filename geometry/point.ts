import { Geometry } from './geometry';
import { IPoint, IPointPair, IRectangle, ICircle, ITriangle, ILine, ISegment, IRay } from './interfaces';


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
    public isEqualTo(b: IPoint): boolean { return Geometry.Point.AreEqual(this, b); }
    public get hash(): string { return Geometry.Point.Hash(this); }

    public setTo(b: IPoint): Point { this.x = b.x; this.y = b.y; return this; }
    public lengthSq(): number { return Geometry.Point.LengthSq(this); }
    public dot(b: IPoint): number { return Geometry.Point.Dot(this, b); }
    public cross(b: IPoint): number { return Geometry.Point.Cross(this, b); }
    public add(b: IPoint): Point { return new Point().setTo(Geometry.Point.Add(this, b)); }
    public subtract(b: IPoint): Point { return new Point().setTo(Geometry.Point.Subtract(this, b)); }
    public proj(b: IPoint): Point { return new Point().setTo(Geometry.Point.Proj(this, b)); }
    public normalized(length: number=1): Point { return new Point().setTo(Geometry.Point.Normalized(this, length)); }
    public scale(scalar: number | IPoint): Point { return new Point().setTo(Geometry.Point.Scale(this, scalar)); }
    public midpoint(...points: IPoint[]): Point { return new Point().setTo(Geometry.Point.Midpoint(this, ...points)); }
    public distanceSqTo(b: IPoint): number { return Geometry.Point.DistanceSq(this, b); }
    public distanceTo(b: IPoint): number { return Geometry.Point.Distance(this, b); }
    public get angle(): number { return Geometry.Point.Angle(this); };

    // TODO: move to Geometry.Point
    public reflect(normal: IPoint, origin: IPoint | null=null): Point {
        if(origin == null)
        {
            const reflectionPoint = this.closestPointOnLine({ a: Point.zero, b: normal });
            return reflectionPoint.subtract(this).scale(2).add(this);
        }

        const reflectionPoint = this.closestPointOnLine({ a: origin, b: Geometry.Point.Add(origin, normal) });
        return reflectionPoint.subtract(this).scale(2).add(this);
    }

    // TODO: move to Geometry.Point
    public closest<T extends IPoint>(points: T[]): T { return points.minOf(o => this.distanceSqTo(o)); }
    
    public closestPointOnLine(line: ILine): Point { return new Point().setTo(Geometry.Line.ClosestPointTo(line, this)); };
    public closestPointOnSegment(segment: ISegment): Point { return new Point().setTo(Geometry.Segment.ClosestPointTo(segment, this)); }
    public closestPointOnRay(ray: IRay): Point { return new Point().setTo(Geometry.Ray.ClosestPointTo(ray, this)); }

    public collidesRectangle(rectangle: IRectangle): boolean { return Geometry.Collide.RectanglePoint(rectangle, this); }
    public collidesCircle(circle: ICircle): boolean { return Geometry.Collide.CirclePoint(circle, this); }
    public collidesTriangle(triangle: ITriangle): boolean { return Geometry.Collide.TrianglePoint(triangle, this); }

    public towardness(point: IPoint): number { return Geometry.Point.Towardness(this, point); }
    public lerp(point: IPoint, t: number): Point { return new Point().setTo(Geometry.Point.Lerp(this, point, t)); };
    public wiggle(angleRangeMax: number): Point { return new Point().setTo(Geometry.Point.Wiggle(this, angleRangeMax)); }
    public negative(): Point { return new Point().setTo(Geometry.Point.Negative(this)); }
    public rotate(angle: number, center: IPoint | null=null): Point { return new Point().setTo(Geometry.Point.Rotate(this, angle, center)); }
    public flip(center: IPoint | null=null): Point { return new Point().setTo(Geometry.Point.Flip(this, center)); }
    public clampedInRectangle(rectangle: IRectangle): Point { return new Point().setTo(Geometry.Point.ClampedInRectangle(this, rectangle)); }
    public isLeftCenterRightOf(pair: IPointPair): number { return Geometry.Point.IsLeftCenterRightOf(this, pair); }
    public isLeftOf(pair: IPointPair): boolean { return Geometry.Point.IsLeftOf(this, pair); }
    public isColinear(pair: IPointPair): boolean { return Geometry.Point.IsColinear(this, pair); }
    public isRightOf(pair: IPointPair): boolean { return Geometry.Point.IsRightOf(this, pair); }
}


// TODO: delete this in favor of Geometry.Point.Up etc. (since they're compile-time readonly)
class ConstPoint extends Point {
    public get x(): number { return this._x; }
    public get y(): number { return this._y; }

    public set x(x: number) { throw 'Cannot set \'x\' property of a ConstPoint'; }
    public set y(y: number) { throw 'Cannot set \'y\' property of a ConstPoint'; }
}

Point.start();