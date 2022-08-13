import { tau } from '../core/utils';
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

export class Polygon implements IPolygon {
  public vertices: Point[] = [];

  constructor(points: IPoint[]) {
    // TODO: consider using windingNumber around a point that is known to be inside the polygon
    //       to determine if it's clockwise and reverse the vertices list if so
    points.forEach(point => this.vertices.push(new Point(point.x, point.y)));
  }

  public static segments(polygon: IPolygon): Segment[] {
    const segments: Segment[] = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      const j = (i + 1) % polygon.vertices.length;
      segments.push(new Segment(Point.Create(polygon.vertices[i]), Point.Create(polygon.vertices[j])));
    }
    return segments;
  }
  public get segments(): Segment[] {
    return Polygon.segments(this);
  }
  public static segmentsWithNormals(polygon: IPolygon): { a: IPoint; b: IPoint; normal: IPoint }[] {
    const segments: { a: IPoint; b: IPoint; normal: IPoint }[] = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      const j = (i + 1) % polygon.vertices.length;
      const a = polygon.vertices[i];
      const b = polygon.vertices[j];
      const normal = Geometry.Point.Normalized(Geometry.Point.Rotate(Geometry.Point.Subtract(b, a), -tau / 4));
      segments.push({ a, b, normal });
    }
    return segments;
  }
  public segmentsWithNormals(): { a: IPoint; b: IPoint; normal: IPoint }[] {
    return Polygon.segmentsWithNormals(this);
  }
  public get bounds(): IRectangle {
    return Geometry.Polygon.Bounds(this);
  }
  public get area(): number {
    return this.triangulation.map(o => Geometry.Triangle.Area(o)).sum() ?? 0;
  }
  public get triangulation(): ITriangle[] {
    return Geometry.Polygon.Triangulation(this);
  }
  public get circumcircle(): ICircle | null {
    return Geometry.Points.Circumcircle(this.vertices);
  }
  public collidesPoint(point: Point): boolean {
    return Geometry.Collide.PolygonPoint(this, point);
  }

  public lineIntersections(line: ILine): Point[] {
    return Polygon.intersections(this, line, PointPairType.LINE);
  }
  public rayIntersections(ray: IRay): Point[] {
    return Polygon.intersections(this, ray, PointPairType.RAY);
  }
  public segmentIntersections(segment: ISegment): Point[] {
    return Polygon.intersections(this, segment, PointPairType.SEGMENT);
  }
  public static intersections(polygon: IPolygon, pair: IPointPair, pairType: PointPairType): Point[] {
    return Polygon.segments(polygon)
      .map(segment => Geometry.Intersection.PointPairPointPair(pair, pairType, segment, PointPairType.SEGMENT))
      .filter(point => point != null)
      .map(point => Point.Create(point)!);
  }
}
