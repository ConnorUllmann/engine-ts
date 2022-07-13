import { Geometry } from './geometry';
import { IPoint, IPointPair, IRectangle, ICircle, ITriangle, ILine, ISegment, IRay, IPolygon } from './interfaces';

export class Point implements IPoint {
  constructor(public x: number = 0, public y: number = 0) {}

  public static Create(point: IPoint): Point;
  public static Create(point: IPoint | null): Point | null;
  public static Create(point: IPoint | null): Point | null {
    return point ? new Point(point.x, point.y) : null;
  }
  public static Vector(length: number, angle: number): Point {
    return Point.Create(Geometry.Point.Vector(length, angle));
  }

  public get clone(): Point {
    return new Point(this.x, this.y);
  }
  public get hash(): string {
    return Geometry.Point.Hash(this);
  }
  public get lengthSq(): number {
    return Geometry.Point.LengthSq(this);
  }
  public get length(): number {
    return Geometry.Point.Length(this);
  }
  public get angle(): number {
    return Geometry.Point.Angle(this);
  }

  public toString(): string {
    return JSON.stringify({ x: this.x.toFixed(1), y: this.y.toFixed(1) });
  }
  public isEqualTo(b: IPoint): boolean {
    return Geometry.Point.AreEqual(this, b);
  }
  public setTo(b: IPoint): this {
    this.x = b.x;
    this.y = b.y;
    return this;
  }
  public setToXY(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public dot(b: IPoint): number {
    return Geometry.Point.Dot(this, b);
  }
  public cross(b: IPoint): number {
    return Geometry.Point.Cross(this, b);
  }
  public add(b: IPoint): this {
    return this.setTo(Geometry.Point.Add(this, b));
  }
  public subtract(b: IPoint): this {
    return this.setTo(Geometry.Point.Subtract(this, b));
  }
  public project(b: IPoint): this {
    return this.setTo(Geometry.Point.Project(this, b));
  }
  public normalize(length: number = 1): this {
    return this.setTo(Geometry.Point.Normalized(this, length));
  }
  public scale(scalar: number | IPoint): this {
    return this.setTo(Geometry.Point.Scale(this, scalar));
  }
  public midpoint(...points: IPoint[]): this {
    const midpoint = Geometry.Point.Midpoint(this, ...points);
    if (midpoint != null) this.setTo(midpoint);
    return this;
  }
  public distanceSqTo(b: IPoint): number {
    return Geometry.Point.DistanceSq(this, b);
  }
  public distanceTo(b: IPoint): number {
    return Geometry.Point.Distance(this, b);
  }
  public reflect(pair: IPointPair): this {
    return this.setTo(Geometry.Point.Reflect(this, pair));
  }
  public towardness(point: IPoint): number {
    return Geometry.Point.Towardness(this, point);
  }
  public lerp(point: IPoint, t: number): this {
    return this.setTo(Geometry.Point.Lerp(this, point, t));
  }
  public wiggle(angleRangeMax: number): this {
    return this.setTo(Geometry.Point.Wiggle(this, angleRangeMax));
  }
  public negative(): this {
    return this.setTo(Geometry.Point.Negative(this));
  }
  public rotate(angle: number, center?: IPoint): this {
    return this.setTo(Geometry.Point.Rotate(this, angle, center));
  }
  public flip(center?: IPoint): this {
    return this.setTo(Geometry.Point.Flip(this, center));
  }
  public clampInRectangle(rectangle: IRectangle): this {
    return this.setTo(Geometry.Point.ClampedInRectangle(this, rectangle));
  }
  public isLeftCenterRightOf(pair: IPointPair): number {
    return Geometry.Point.IsLeftCenterRightOf(this, pair);
  }
  public isLeftOf(pair: IPointPair): boolean {
    return Geometry.Point.IsLeftOf(this, pair);
  }
  public isColinearWith(pair: IPointPair): boolean {
    return Geometry.Point.IsColinearWith(this, pair);
  }
  public isRightOf(pair: IPointPair): boolean {
    return Geometry.Point.IsRightOf(this, pair);
  }

  public closestPointOnLine(line: ILine): IPoint {
    return Geometry.Line.ClosestPointTo(line, this);
  }
  public closestPointOnSegment(segment: ISegment): IPoint {
    return Geometry.Segment.ClosestPointTo(segment, this);
  }
  public closestPointOnRay(ray: IRay): IPoint {
    return Geometry.Ray.ClosestPointTo(ray, this);
  }

  public collidesRectangle(rectangle: IRectangle): boolean {
    return Geometry.Collide.RectanglePoint(rectangle, this);
  }
  public collidesCircle(circle: ICircle): boolean {
    return Geometry.Collide.CirclePoint(circle, this);
  }
  public collidesTriangle(triangle: ITriangle): boolean {
    return Geometry.Collide.TrianglePoint(triangle, this);
  }
  public collidesPolygon(polygon: IPolygon): boolean {
    return Geometry.Collide.PolygonPoint(polygon, this);
  }
}

export class NullablePoint {
  private _value = { x: 0, y: 0 };
  private _hasValue = false;

  public get value(): IPoint | null {
    return this._hasValue ? this._value : null;
  }
  public set value(_value: IPoint | null) {
    if (_value == null) {
      this._hasValue = false;
      return;
    }

    this._value.x = _value.x;
    this._value.y = _value.y;
    this._hasValue = true;
  }

  public set(x: number, y: number) {
    this._hasValue = true;
    this._value.x = x;
    this._value.y = y;
  }

  constructor(_value: IPoint | null = null) {
    this.value = _value;
  }
}
