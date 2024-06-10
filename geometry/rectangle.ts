import { RNG } from '../core/rng';
import { DeepReadonly, rng } from '../core/utils';
import { Geometry } from './geometry';
import {
  ICircle,
  ILine,
  IPoint,
  IPointPair,
  IPolygon,
  IRay,
  IRectangle,
  ISegment,
  ITriangle,
  PointPairType,
} from './interfaces';
import { Point } from './point';
import { Segment } from './segment';

// TODO: decide if this should extend Point or just implement IPoint via IRectangle
export class Rectangle extends Point implements IRectangle, IPolygon {
  public get xLeft(): number {
    return this.x;
  }
  public set xLeft(x: number) {
    this.x = x;
  }
  public get xRight(): number {
    return this.x + this.w;
  }
  public set xRight(x: number) {
    this.x = x - this.w;
  }
  public get yTop(): number {
    return this.y;
  }
  public set yTop(y: number) {
    this.y = y;
  }
  public get yBottom(): number {
    return this.y + this.h;
  }
  public set yBottom(y: number) {
    this.y = y - this.h;
  }
  public get xCenter(): number {
    return this.x + this.w / 2;
  }
  public set xCenter(x: number) {
    this.x = x - this.w / 2;
  }
  public get yCenter(): number {
    return this.y + this.h / 2;
  }
  public set yCenter(y: number) {
    this.y = y - this.h / 2;
  }
  private _center = { x: 0, y: 0 };
  public get center(): Readonly<IPoint> {
    this._center.x = this.x + this.w / 2;
    this._center.y = this.y + this.h / 2;
    return this._center;
  }
  public set center(center: Point) {
    this.x = center.x - this.w / 2;
    this.y = center.y - this.h / 2;
  }

  public get topLeft(): Point {
    return new Point(this.xLeft, this.yTop);
  }
  public get topRight(): Point {
    return new Point(this.xRight, this.yTop);
  }
  public get bottomLeft(): Point {
    return new Point(this.xLeft, this.yBottom);
  }
  public get bottomRight(): Point {
    return new Point(this.xRight, this.yBottom);
  }
  public get vertices(): Point[] {
    return Geometry.Rectangle.Vertices(this).map(p => Point.Create(p));
  }
  public get segments(): Segment[] {
    return Geometry.Rectangle.Segments(this).map(segment => Segment.Create(segment));
  }
  public get triangulation(): ITriangle[] {
    return Geometry.Rectangle.Triangulation(this);
  }
  public get circumcircle(): ICircle {
    return Geometry.Rectangle.Circumcircle(this);
  }
  public get bounds(): IRectangle {
    return this;
  }
  public get area(): number {
    return Geometry.Rectangle.Area(this);
  }

  private _w: number;
  private _h: number;

  public get w(): number {
    return this._w;
  }
  public get h(): number {
    return this._h;
  }

  public set w(w: number) {
    this._w = w;
  }
  public set h(h: number) {
    this._h = h;
  }

  constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
    super(x, y);
    this._w = w;
    this._h = h;
  }

  public static Create(rectangle: IRectangle): Rectangle {
    return new Rectangle(rectangle.x, rectangle.y, rectangle.w, rectangle.h);
  }

  public get clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.w, this.h);
  }
  public setTo(rectangle: IRectangle): this {
    this.x = rectangle.x;
    this.y = rectangle.y;
    this.w = rectangle.w;
    this.h = rectangle.h;
    return this;
  }

  public offset(other: IPoint): Rectangle {
    return new Rectangle(this.x + other.x, this.y + other.y, this.w, this.h);
  }
  public collidesPoint(point: IPoint): boolean {
    return Geometry.Collide.RectanglePoint(this, point);
  }
  public collidesRectangle(rectangle: IRectangle): boolean {
    return Geometry.Collide.RectangleRectangle(this, rectangle);
  }
  public collidesCircle(circle: ICircle, aOffset?: IPoint, bOffset?: IPoint, rectangleAngle: number = 0): boolean {
    return Geometry.Collide.RectangleCircle(this, circle, aOffset, bOffset, rectangleAngle);
  }

  public lineIntersections(line: ILine): Point[] {
    return Rectangle.Intersections(this, line, PointPairType.LINE);
  }
  public rayIntersections(ray: IRay): Point[] {
    return Rectangle.Intersections(this, ray, PointPairType.RAY);
  }
  public segmentIntersections(segment: ISegment): Point[] {
    return Rectangle.Intersections(this, segment, PointPairType.SEGMENT);
  }
  public static Intersections(
    { x, y, w, h }: IRectangle,
    { a: { x: ax, y: ay }, b: { x: bx, y: by } }: IPointPair,
    pairType: PointPairType
  ): Point[] {
    return Geometry.IntersectionExplicit.RectanglePointPair(x, y, w, h, ax, ay, bx, by, pairType).map(point =>
      Point.Create(point)
    );
  }

  public expand(wAmount: number, hAmount?: number): this {
    return this.setTo(Geometry.Rectangle.Expand(this, wAmount, hAmount));
  }

  public scale(scalar: number, center?: IPoint): this {
    return this.setTo(Geometry.Rectangle.Scale(this, scalar, center));
  }

  public randomPointInside(_rng: RNG = rng): Point {
    return new Point(_rng.random() * this.w + this.x, _rng.random() * this.h + this.y);
  }
}

export class NullableRectangle {
  private _value = { x: 0, y: 0, w: 0, h: 0 };
  private _hasValue = false;

  public get value(): IRectangle | null {
    return this._hasValue ? this._value : null;
  }
  public set value(_value: DeepReadonly<IRectangle> | null) {
    if (_value == null) {
      this._hasValue = false;
      return;
    }

    this._value.x = _value.x;
    this._value.y = _value.y;
    this._value.w = _value.w;
    this._value.h = _value.h;
    this._hasValue = true;
  }

  public get valueRaw(): IRectangle {
    return this._value;
  }

  public set(x: number, y: number, w: number, h: number) {
    this._hasValue = true;
    this._value.x = x;
    this._value.y = y;
    this._value.w = w;
    this._value.h = h;
  }

  constructor(_value: IRectangle | null = null) {
    this.value = _value;
  }
}
