import { Segment } from './segment';
import { Geometry } from './geometry';
import {
  ITriangle,
  IPolygon,
  ICircle,
  IRectangle,
  IPoint,
  ILine,
  PointPairType,
  IRay,
  ISegment,
  IPointPair,
} from './interfaces';
import { Point } from './point';

export class Triangle implements ITriangle, IPolygon {
  constructor(public a: Point, public b: Point, public c: Point) {}
  public get clone(): Triangle {
    return new Triangle(this.a.clone, this.b.clone, this.c.clone);
  }

  public get vertices(): Point[] {
    return [this.a, this.b, this.c];
  }
  public get segments(): Segment[] {
    return Geometry.Triangle.Segments(this).map(segment => Segment.Create(segment));
  }
  public get hash(): string {
    return Geometry.Triangle.Hash(this);
  }
  public get circumcircle(): ICircle {
    return Geometry.Triangle.Circumcircle(this);
  }
  public get triangulation(): ITriangle[] {
    return Geometry.Triangle.Triangulation(this);
  }
  public get areaSigned(): number {
    return Geometry.Triangle.AreaSigned(this);
  }
  public get area(): number {
    return Geometry.Triangle.Area(this);
  }
  public get bounds(): IRectangle {
    return Geometry.Triangle.Bounds(this);
  }
  public isEqualTo(triangle: ITriangle): boolean {
    return Geometry.Triangle.Hash(triangle) === this.hash;
  }

  public collidesPoint(point: IPoint): boolean {
    return Geometry.Collide.TrianglePoint(this, point);
  }
  public lineIntersections(line: ILine): Point[] {
    return Triangle.intersections(this, line, PointPairType.LINE);
  }
  public rayIntersections(ray: IRay): Point[] {
    return Triangle.intersections(this, ray, PointPairType.RAY);
  }
  public segmentIntersections(segment: ISegment): Point[] {
    return Triangle.intersections(this, segment, PointPairType.SEGMENT);
  }
  public static intersections(triangle: ITriangle, pair: IPointPair, pairType: PointPairType): Point[] {
    return Geometry.Triangle.Segments(triangle)
      .map(segment => Geometry.Intersection.PointPair(pair, pairType, segment, PointPairType.SEGMENT))
      .filter(point => point != null)
      .map(point => Point.Create(point)!);
  }
}
