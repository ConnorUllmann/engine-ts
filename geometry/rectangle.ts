import { Segment } from './segment';
import { random } from '@engine-ts/core/utils';
import { Geometry } from './geometry';
import { Point } from './point';
import { IRectangle, IPolygon, ITriangle, ICircle, IPoint, ILine, PointPairType, IRay, ISegment, IPointPair } from './interfaces';


export class Rectangle extends Point implements IRectangle, IPolygon {
    public get xLeft(): number { return this.x; }
    public set xLeft(x: number) { this.x = x; }
    public get xRight(): number { return this.x + this.w; }
    public set xRight(x: number) { this.x = x - this.w; }
    public get yTop(): number { return this.y; }
    public set yTop(y: number) { this.y = y; }
    public get yBottom(): number { return this.y + this.h; }
    public set yBottom(y: number) { this.y = y - this.h; }
    public get xCenter(): number { return this.x + this.w/2; }
    public set xCenter(x: number) { this.x = x - this.w/2; }
    public get yCenter(): number { return this.y + this.h/2; }
    public set yCenter(y: number) { this.y = y - this.h/2; }
    public get center(): Point { return new Point(this.xCenter, this.yCenter); }
    public set center(center: Point) { this.x = center.x - this.w/2; this.y = center.y - this.h/2; }

    public get topLeft(): Point { return new Point(this.xLeft, this.yTop); }
    public get topRight(): Point { return new Point(this.xRight, this.yTop); }
    public get bottomLeft(): Point { return new Point(this.xLeft, this.yBottom); }
    public get bottomRight(): Point { return new Point(this.xRight, this.yBottom); }
    public get corners(): Point[] { return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]; }
    public get vertices(): Point[] { return this.corners; }
    public get segments(): Segment[] {
        return Geometry.Points.Segments(this.corners)
            .map(segment => new Segment(new Point().setTo(segment.a), new Point().setTo(segment.b)));
    }
    public get triangulation(): ITriangle[] { return Geometry.Rectangle.Triangulation(this); }
    public get circumcircle(): ICircle { return Geometry.Rectangle.Circumcircle(this); }
    public get area(): number { return Geometry.Rectangle.Area(this); }

    private _w: number;
    private _h: number;

    public get w(): number { return this._w; }
    public get h(): number { return this._h; }

    public set w(w: number) { this._w = w; }
    public set h(h: number) { this._h = h; }

    constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
        super(x, y);
        this._w = w;
        this._h = h;
    }

    public cloneRectangle(): Rectangle { return new Rectangle(this.x, this.y, this.w, this.h); }
    public offset(other: IPoint): Rectangle { return new Rectangle(this.x + other.x, this.y + other.y, this.w, this.h); }
    public collidesPoint(point: IPoint): boolean { return Geometry.Collide.RectanglePoint(this, point); }
    public collidesRectangle(rectangle: IRectangle): boolean { return Geometry.Collide.RectangleRectangle(this, rectangle); }
    public collidesCircle(circle: ICircle, rectangleAngle: number=0): boolean { return Geometry.Collide.RectangleCircle(this, circle, rectangleAngle); }
    
    public lineIntersections(line: ILine): Point[] { return Rectangle.intersections(this, line, PointPairType.LINE); }
    public rayIntersections(ray: IRay): Point[] { return Rectangle.intersections(this, ray, PointPairType.RAY); }
    public segmentIntersections(segment: ISegment): Point[] { return Rectangle.intersections(this, segment, PointPairType.SEGMENT); }
    public static intersections(rectangle: IRectangle, pair: IPointPair, pairType: PointPairType): Point[] { 
        return Geometry.Rectangle.Segments(rectangle)
            .map(segment => Geometry.Intersection.PointPair(pair, pairType, segment, PointPairType.SEGMENT))
            .filter(point => point != null)
            .map(point => new Point().setTo(point));
    }

    // Expands the rectangle by the given amount on each side
    public expandFromCenter(amount: number): void {
        this.x -= amount;
        this.w += 2 * amount;
        this.y -= amount;
        this.h += 2 * amount;
    };

    // Returns a copy of this rectangle expanded by the given amount on each side
    public expandedFromCenter(amount: number): Rectangle {
        const result = this.cloneRectangle();
        result.expandFromCenter(amount);
        return result;
    };

    // Expands the rectangle by the given amount on each side, scaled by the current side lengths
    public scaleFromCenter(scalar: number): void {
        const wAmount = this.w / 2 * scalar;
        const hAmount = this.h / 2 * scalar;
        this.x -= wAmount;
        this.w += 2 * wAmount;
        this.y -= hAmount;
        this.h += 2 * hAmount;
    };

    // Returns a copy of this rectangle expanded by the given amount on each side, scaled by the current side lengths
    public scaledFromCenter(scalar: number): Rectangle {
        const result = this.cloneRectangle();
        result.scaleFromCenter(scalar);
        return result;
    };

    public get randomPointInside(): Point {
        return new Point(random() * this.w + this.x, random() * this.h + this.y);
    }

    // don't return a copy since it's readonly anyway
    public get bounds(): IRectangle { return this; }
}