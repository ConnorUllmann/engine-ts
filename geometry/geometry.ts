import { RNG } from '../core/rng';
import { angle180, angle90, binomialCoefficient, clamp, DeepReadonly, moduloSafe, rng, tau } from '../core/utils';
import { Halign, Valign } from '../visuals/align';
import {
  ICircle,
  ILine,
  IPath,
  IPoint,
  IPointPair,
  IPolygon,
  IRay,
  IRaycastResult,
  IRectangle,
  ISegment,
  ITriangle,
  PointPairType,
} from './interfaces';
import {
  BoundableShape,
  IsCircle,
  IsLine,
  IsPath,
  IsPoint,
  IsPolygon,
  IsRay,
  IsRectangle,
  IsSegment,
  IsTriangle,
  Shape,
} from './shape-type';

interface IGeometryStatic<T> {
  Translate: (t: DeepReadonly<T>, offset: DeepReadonly<IPoint>) => T;
  Hash: (t: DeepReadonly<T>) => string;
  // Can't add Rotate because a rectangle can't truly rotate (must be aligned with x/y axes)
  //Rotate: (t: T, angle: number, center?: DeepReadonly<IPoint>) => T,
}

interface IShapeStatic<T> extends IPointListStatic<T> {
  Midpoint: (o: DeepReadonly<T>) => IPoint | null;
  Area: (o: DeepReadonly<T>) => number;
}

interface IRectangleStatic extends IShapeStatic<IRectangle> {
  Midpoint: (o: DeepReadonly<IRectangle>) => IPoint;
  BoundsRectangles: (rectangles: DeepReadonly<DeepReadonly<IRectangle>[]>) => IRectangle;
  Scale: (
    rectangle: DeepReadonly<IRectangle>,
    scalar: number | DeepReadonly<IPoint>,
    center?: DeepReadonly<IPoint>
  ) => IRectangle;
  // Expands this rectangle by the given amount on each side (if hAmount isn't specified, wAmount will be used)
  Expand: (rectangle: DeepReadonly<IRectangle>, wAmount: number, hAmount?: number) => IRectangle;
  RandomPointInside: (rectangle: DeepReadonly<IRectangle>, rng?: RNG) => IPoint;
  ClosestPointOutside: (rectangle: DeepReadonly<IRectangle>, position: IPoint) => IPoint;
  ClosestPointInside: (rectangle: DeepReadonly<IRectangle>, position: IPoint) => IPoint;
  Square: (center: DeepReadonly<IPoint>, sideLength: number) => IRectangle;
  Circumcircle: (t: DeepReadonly<IRectangle>) => ICircle;
  Translate: (rectangle: DeepReadonly<IRectangle>, translation: DeepReadonly<IPoint>) => IRectangle;
  Align: (rectangle: DeepReadonly<IRectangle>, halign: Halign, valign: Valign) => IRectangle;
  Center: (rectangle: DeepReadonly<IRectangle>) => IPoint;
  TopLeft: (rectangle: DeepReadonly<IRectangle>) => IPoint;
  TopRight: (rectangle: DeepReadonly<IRectangle>) => IPoint;
  BottomLeft: (rectangle: DeepReadonly<IRectangle>) => IPoint;
  BottomRight: (rectangle: DeepReadonly<IRectangle>) => IPoint;
  xLeft: (rectangle: DeepReadonly<IRectangle>) => number;
  xRight: (rectangle: DeepReadonly<IRectangle>) => number;
  yTop: (rectangle: DeepReadonly<IRectangle>) => number;
  yBottom: (rectangle: DeepReadonly<IRectangle>) => number;
}

interface ICircleStatic extends IGeometryStatic<ICircle> {
  Circumcircle: (circle: DeepReadonly<ICircle>) => ICircle;
  Supertriangle: (circle: DeepReadonly<ICircle>) => ITriangle;
  Midpoint: (circle: DeepReadonly<ICircle>) => IPoint;
  Area: (circle: DeepReadonly<ICircle>) => number;
  Circumference: (circle: DeepReadonly<ICircle>) => number;
  Bounds: (circle: DeepReadonly<ICircle>) => IRectangle;
  SetRectangleToBounds: (circle: DeepReadonly<ICircle>, rectangle: IRectangle) => void;
  RandomPointInside: (circle: DeepReadonly<ICircle>, rng?: RNG) => IPoint;
  Rotate: (circle: DeepReadonly<ICircle>, angle: number, center?: DeepReadonly<IPoint>) => ICircle;
  // returns the points on 'circle' that are tangent when they form a segment with 'point'
  TangentPoints: (circle: DeepReadonly<ICircle>, point: DeepReadonly<IPoint>) => { a: IPoint; b: IPoint } | null;
}

interface ITriangleStatic extends IShapeStatic<ITriangle> {
  Midpoint: (o: DeepReadonly<ITriangle>) => IPoint;
  AreaSigned: (triangle: DeepReadonly<ITriangle>) => number;

  // TODO: add these to IShapeStatic<T>
  Perimeter: (triangle: DeepReadonly<ITriangle>) => number;
  Semiperimeter: (triangle: DeepReadonly<ITriangle>) => number;

  Incenter: (triangle: DeepReadonly<ITriangle>) => IPoint;
  Inradius: (triangle: DeepReadonly<ITriangle>) => number;
  InscribedCircle: (triangle: DeepReadonly<ITriangle>) => ICircle;
  Circumcircle: (t: DeepReadonly<ITriangle>) => ICircle;
  AngleA: (triangle: DeepReadonly<ITriangle>) => number;
  AngleB: (triangle: DeepReadonly<ITriangle>) => number;
  AngleC: (triangle: DeepReadonly<ITriangle>) => number;
  LengthAB: (triangle: DeepReadonly<ITriangle>) => number;
  LengthBC: (triangle: DeepReadonly<ITriangle>) => number;
  LengthCA: (triangle: DeepReadonly<ITriangle>) => number;
  AngleBisector: (
    bisectionVertex: DeepReadonly<IPoint>,
    previousVertex: DeepReadonly<IPoint>,
    nextVertex: DeepReadonly<IPoint>
  ) => IRay;
  AngleBisectorA: (triangle: DeepReadonly<ITriangle>) => IRay;
  AngleBisectorB: (triangle: DeepReadonly<ITriangle>) => IRay;
  AngleBisectorC: (triangle: DeepReadonly<ITriangle>) => IRay;
  PerpendicularBisectorAB: (triangle: DeepReadonly<ITriangle>) => ILine;
  PerpendicularBisectorBC: (triangle: DeepReadonly<ITriangle>) => ILine;
  PerpendicularBisectorCA: (triangle: DeepReadonly<ITriangle>) => ILine;
  Rotate: (triangle: DeepReadonly<ITriangle>, angle: number, center?: DeepReadonly<IPoint>) => ITriangle;
}

interface IPolygonStatic extends IShapeStatic<IPolygon> {
  Explicit: {
    WindingNumber: (polygon: DeepReadonly<IPolygon>, px: number, py: number) => number;
  };
  WindingNumber: (polygon: DeepReadonly<IPolygon>, point: DeepReadonly<IPoint>) => number;
  Rotate: (polygon: DeepReadonly<IPolygon>, angle: number, center?: DeepReadonly<IPoint>) => IPolygon;
  GetRegularPolygonPoints: (radius: number, sides: number, angle?: number) => IPolygon;
  // TODO: function for creating regular polygons (copy "_getRegularPolygonPoints" in Draw.ts)
}

interface IPointPairStatic<T extends IPointPair> {
  AreEqual: (pairA: DeepReadonly<T>, pairB: DeepReadonly<T>) => boolean;
  YatX: (pair: DeepReadonly<T>, x: number) => number | null;
  XatY: (pair: DeepReadonly<T>, y: number) => number | null;
  Slope: (pair: DeepReadonly<T>) => number;
  Hash: (pair: DeepReadonly<T>) => string;
  Translate: (pair: DeepReadonly<T>, offset: DeepReadonly<IPoint>) => T;
  ClosestPointTo: (pair: DeepReadonly<T>, point: DeepReadonly<IPoint>) => IPoint;
}

interface ISegmentStatic extends IPointPairStatic<ISegment> {
  Midpoint: (segment: DeepReadonly<ISegment>) => IPoint;
  PerpendicularBisector: (segment: DeepReadonly<ISegment>) => ILine;
  SharedVertex: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>) => IPoint | null;
  Bounds: (segment: DeepReadonly<ISegment>) => IRectangle;
  SetRectangleToBounds: (segment: DeepReadonly<ISegment>, rectangle: IRectangle) => void;
}

interface IRayStatic extends IPointPairStatic<IRay> {
  Explicit: {
    ClosestPointXTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number) => number;
    ClosestPointYTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number) => number;
  };
  DefaultMaxDistance: number;
  AsSegment: (ray: DeepReadonly<IRay>, length: number) => ISegment;
  PointAtDistance: (ray: DeepReadonly<IRay>, length: number) => IPoint;
  Cast: (
    ray: DeepReadonly<IRay>,
    segments: DeepReadonly<DeepReadonly<ISegment>[]>,
    maxDistance: number
  ) => IRaycastResult<ISegment> | null;
}

interface ILineStatic extends IPointPairStatic<ILine> {
  Explicit: {
    ClosestPointXTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number) => number;
    ClosestPointYTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number) => number;
  };
  Yintercept: (line: DeepReadonly<ILine>) => number;
  YatX: (pair: DeepReadonly<ILine>, x: number) => number;
  XatY: (pair: DeepReadonly<ILine>, y: number) => number;
}

interface IPointStatic extends IGeometryStatic<IPoint> {
  readonly Zero: DeepReadonly<{ x: 0; y: 0 }>;
  readonly One: DeepReadonly<{ x: 1; y: 1 }>;
  readonly Up: DeepReadonly<{ x: 0; y: -1 }>;
  readonly Down: DeepReadonly<{ x: 0; y: 1 }>;
  readonly Left: DeepReadonly<{ x: -1; y: 0 }>;
  readonly Right: DeepReadonly<{ x: 1; y: 0 }>;
  readonly UpRight: DeepReadonly<{ x: 1; y: -1 }>;
  readonly UpLeft: DeepReadonly<{ x: -1; y: -1 }>;
  readonly DownRight: DeepReadonly<{ x: 1; y: 1 }>;
  readonly DownLeft: DeepReadonly<{ x: -1; y: 1 }>;
  readonly CardinalDirections: DeepReadonly<[{ x: 1; y: 0 }, { x: 0; y: -1 }, { x: -1; y: 0 }, { x: 0; y: 1 }]>;
  AreEqual: (a?: DeepReadonly<IPoint> | null, b?: DeepReadonly<IPoint> | null) => boolean;
  DistanceSq: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number;
  Distance: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number;
  Add: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => IPoint;
  Subtract: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => IPoint;
  Midpoint: (...points: DeepReadonly<DeepReadonly<IPoint>[]>) => IPoint | null;
  Angle: (point: DeepReadonly<IPoint>) => number;
  AngleTo: (to: DeepReadonly<IPoint>, from: DeepReadonly<IPoint>) => number;
  Scale: (point: DeepReadonly<IPoint>, scalar: number | DeepReadonly<IPoint>, from?: DeepReadonly<IPoint>) => IPoint;
  LengthSq: (point: DeepReadonly<IPoint>) => number;
  Length: (point: DeepReadonly<IPoint>) => number;
  Dot: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number;
  Cross: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number;
  Project: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => IPoint;
  Normalized: (point: DeepReadonly<IPoint>, length?: number) => IPoint;
  Rotate: (point: DeepReadonly<IPoint>, angle: number, center?: DeepReadonly<IPoint>) => IPoint;
  Negative: (point: DeepReadonly<IPoint>) => IPoint;
  Wiggle: (point: DeepReadonly<IPoint>, angleRangeMax: number, center?: DeepReadonly<IPoint>, rng?: RNG) => IPoint;
  Towardness: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>) => number;
  Lerp: (from: DeepReadonly<IPoint>, to: DeepReadonly<IPoint>, t: number) => IPoint;
  Flip: (point: DeepReadonly<IPoint>, center?: DeepReadonly<IPoint>) => IPoint;
  Reflect: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => IPoint;
  ClampedInRectangle: (point: DeepReadonly<IPoint>, rectangle: DeepReadonly<IRectangle>) => IPoint;
  Vector: (length: number, angle: number) => IPoint;
  UnitVector: (angle: number) => IPoint;
  IsLeftCenterRightOf: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>) => number;
  IsLeftOf: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => boolean;
  IsColinearWith: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => boolean;
  InsideSegmentIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<ISegment>) => boolean;
  InsideRayIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IRay>) => boolean;
  IsRightOf: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>) => boolean;
  // Returns a list of the velocity vectors a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
  // given the speed of the shot and gravity. Returns 0, 1, or 2 Points (if two points, the highest-arching vector is first)
  LaunchVectors: (
    start: DeepReadonly<IPoint>,
    target: DeepReadonly<IPoint>,
    gravityMagnitude: number,
    velocityMagnitude: number
  ) => IPoint[];
  // Returns the velocity vector a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
  // given the angle of the shot and gravity.
  // Returns null if not possible. If gravityMagnitude > 0, then using angle = -Math.PI/4 will determine the speed of a shot upward at 45 degrees
  LaunchVector: (
    start: DeepReadonly<IPoint>,
    target: DeepReadonly<IPoint>,
    gravityMagnitude: number,
    angle: number
  ) => IPoint | null;
  // Returns the velocity vector a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
  // given the angle of the shot when facing to the right (and reflected over the y-axis if facing the wrong direction) and gravity.
  // Returns null if not possible. If gravityMagnitude > 0, then using angle = -Math.PI/4 will determine the speed of a shot upward at 45 degrees
  LaunchVectorReflective: (
    start: DeepReadonly<IPoint>,
    target: DeepReadonly<IPoint>,
    gravityMagnitude: number,
    angle: number
  ) => IPoint | null;
}

interface IPointListStatic<T> extends IGeometryStatic<T> {
  Segments: (t: DeepReadonly<T>, offset?: DeepReadonly<IPoint>) => ISegment[];
  Vertices: (t: DeepReadonly<T>, offset?: DeepReadonly<IPoint>) => IPoint[];
  Circumcircle: (t: DeepReadonly<T>) => ICircle | null;
  Supertriangle: (t: DeepReadonly<T>) => ITriangle | null;
  Triangulation: (t: DeepReadonly<T>) => ITriangle[];
  Bounds: (t: DeepReadonly<T>) => IRectangle;
  SetRectangleToBounds: (t: DeepReadonly<T>, r: IRectangle) => void;
  Hash: (t: DeepReadonly<T>) => string;
}

interface IPointsStatic extends IPointListStatic<IPoint[]> {
  Sum: (points: DeepReadonly<DeepReadonly<IPoint>[]>) => IPoint;
  BezierPoint: (points: DeepReadonly<DeepReadonly<IPoint>[]>, t: number) => IPoint;
  Bezier: (points: DeepReadonly<DeepReadonly<IPoint>[]>, count: number) => IPoint[];
}

export class Geometry {
  private static readonly HashDecimalDigits: number = 6;
  private static readonly Tolerance: number = 0.00000001;

  public static IsWithinToleranceOf(a: number, b: number = 0): boolean {
    return Math.abs(a - b) < this.Tolerance;
  }

  public static DistanceSq(ax: number, ay: number, bx: number = 0, by: number = 0): number {
    return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
  }
  public static Distance(ax: number, ay: number, bx: number = 0, by: number = 0): number {
    return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
  }
  public static Dot(ax: number, ay: number, bx: number, by: number): number {
    return ax * bx + ay * by;
  }
  public static ProjectX(ax: number, ay: number, bx: number, by: number): number {
    return (bx * (ax * bx + ay * by)) / Math.max(bx * bx + by * by, Geometry.Tolerance);
  }
  public static ProjectY(ax: number, ay: number, bx: number, by: number): number {
    return (by * (ax * bx + ay * by)) / Math.max(bx * bx + by * by, Geometry.Tolerance);
  }
  public static Angle(x: number, y: number): number {
    return Math.atan2(y, x);
  }
  public static AngleTo(xTo: number, yTo: number, xFrom: number, yFrom: number): number {
    return Math.atan2(yTo - yFrom, xTo - xFrom);
  }
  public static AngleDifference(to: number, from: number): number {
    return moduloSafe(to - from - Math.PI, tau) - Math.PI;
  }
  public static ReflectAngleOverXAxis(angle: number): number {
    return moduloSafe(-angle, tau);
  }
  public static ReflectAngleOverYAxis(angle: number): number {
    return moduloSafe(Math.PI - angle, tau);
  }
  public static AngleUpwardness(angle: number): number {
    return Math.abs(Geometry.AngleDifference(angle, angle90)) / angle180;
  }
  public static RotateX(x: number, y: number, angle: number, xCenter?: number, yCenter?: number): number {
    xCenter = xCenter ?? 0;
    yCenter = yCenter ?? 0;
    x = x - xCenter;
    y = y - yCenter;
    return xCenter + x * Math.cos(angle) - y * Math.sin(angle);
  }
  public static RotateY(x: number, y: number, angle: number, xCenter?: number, yCenter?: number): number {
    xCenter = xCenter ?? 0;
    yCenter = yCenter ?? 0;
    x = x - xCenter;
    y = y - yCenter;
    return yCenter + y * Math.cos(angle) + x * Math.sin(angle);
  }
  // if result is > 0, then this point is left of the line/segment/ray formed by the two points.
  // if result is < 0, then this point is right of the line/segment/ray formed by the two points.
  // if result == 0, then it is colinear with the two points.
  public static IsLeftCenterRightOf(
    xTest: number,
    yTest: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): number {
    return Math.sign((bx - ax) * (yTest - ay) - (by - ay) * (xTest - ax));
  }
  public static IsLeftOf(xTest: number, yTest: number, ax: number, ay: number, bx: number, by: number): boolean {
    return Geometry.IsLeftCenterRightOf(xTest, yTest, ax, ay, bx, by) > 0;
  }
  public static IsRightOf(xTest: number, yTest: number, ax: number, ay: number, bx: number, by: number): boolean {
    return Geometry.IsLeftCenterRightOf(xTest, yTest, ax, ay, bx, by) < 0;
  }
  public static IsColinearWith(xTest: number, yTest: number, ax: number, ay: number, bx: number, by: number): boolean {
    return Geometry.IsWithinToleranceOf(Geometry.IsLeftCenterRightOf(xTest, yTest, ax, ay, bx, by));
  }
  // Assuming that (xTest,yTest) is on the line formed by (ax,ay) & (bx,by), return whether (xTest,yTest) on the segment formed by (ax,ay) & (bx, by)
  public static InsideSegmentIfColinear(
    xTest: number,
    yTest: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): boolean {
    const apx = xTest - ax;
    const apy = yTest - ay;
    const abx = bx - ax;
    const aby = by - ay;
    const v = Geometry.Dot(apx, apy, abx, aby);
    return v >= 0 && v <= Geometry.DistanceSq(abx, aby);
  }
  // Assuming that (xTest,yTest) is on the line formed by (ax,ay) & (bx,by), return whether (xTest,yTest) on the ray formed by (ax,ay) & (bx, by)
  public static InsideRayIfColinear(
    xTest: number,
    yTest: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): boolean {
    const apx = xTest - ax;
    const apy = yTest - ay;
    const abx = bx - ax;
    const aby = by - ay;
    const v = Geometry.Dot(apx, apy, abx, aby);
    return v >= 0;
  }

  public static Rectangle: IRectangleStatic = {
    Segments: (rectangle: DeepReadonly<IRectangle>, offset: DeepReadonly<IPoint> = Geometry.Point.Zero): ISegment[] =>
      Geometry.Points.Segments(Geometry.Rectangle.Vertices(rectangle, offset)),
    Vertices: (rectangle: DeepReadonly<IRectangle>, offset: DeepReadonly<IPoint> = Geometry.Point.Zero): IPoint[] => [
      { x: rectangle.x + offset.x, y: rectangle.y + offset.y },
      { x: rectangle.x + rectangle.w + offset.x, y: rectangle.y + offset.y },
      {
        x: rectangle.x + rectangle.w + offset.x,
        y: rectangle.y + rectangle.h + offset.y,
      },
      { x: rectangle.x + offset.x, y: rectangle.y + rectangle.h + offset.y },
    ],
    Circumcircle: (rectangle: DeepReadonly<IRectangle>): ICircle => ({
      x: rectangle.x + rectangle.w / 2,
      y: rectangle.y + rectangle.h / 2,
      r: Geometry.Point.Length({ x: rectangle.w / 2, y: rectangle.h / 2 }),
    }),
    Supertriangle: (rectangle: DeepReadonly<IRectangle>): ITriangle | null =>
      Geometry.Points.Supertriangle(Geometry.Rectangle.Vertices(rectangle)),
    Triangulation: (rectangle: DeepReadonly<IRectangle>): ITriangle[] => {
      const corners = Geometry.Rectangle.Vertices(rectangle);
      return [
        { a: corners[1], b: corners[0], c: corners[2] },
        { a: corners[0], b: corners[3], c: corners[2] },
      ];
    },
    Bounds: (rectangle: DeepReadonly<IRectangle>): IRectangle => {
      const temp = { x: 0, y: 0, w: 0, h: 0 };
      Geometry.Rectangle.SetRectangleToBounds(rectangle, temp);
      return temp;
    },
    SetRectangleToBounds: (rectangle: DeepReadonly<IRectangle>, rectangleToChange: IRectangle): void => {
      rectangleToChange.x = rectangle.x;
      rectangleToChange.y = rectangle.y;
      rectangleToChange.w = rectangle.w;
      rectangleToChange.h = rectangle.h;
    },
    BoundsRectangles: (rectangles: DeepReadonly<IRectangle>[]) => {
      if (rectangles == null || rectangles.length <= 0) return { x: 0, y: 0, w: 0, h: 0 };
      let xMin = rectangles[0].x;
      let yMin = rectangles[0].y;
      let xMax = rectangles[0].x + rectangles[0].w;
      let yMax = rectangles[0].y + rectangles[0].h;
      for (let i = 1; i < rectangles.length; i++) {
        const rectangle = rectangles[i];
        xMin = Math.min(rectangle.x, xMin);
        yMin = Math.min(rectangle.y, yMin);
        xMax = Math.max(rectangle.x + rectangle.w, xMax);
        yMax = Math.max(rectangle.y + rectangle.h, yMax);
      }
      return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
    },
    Midpoint: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
      x: rectangle.x + rectangle.w / 2,
      y: rectangle.y + rectangle.h / 2,
    }),
    Area: (rectangle: DeepReadonly<IRectangle>): number => rectangle.w * rectangle.h,
    Hash: (rectangle: DeepReadonly<IRectangle>): string => Geometry.Points.Hash(Geometry.Rectangle.Vertices(rectangle)),
    // Expands the size of this rectangle by the given amount relative to its current size.
    // "center" defines the position the rectangle is expanding from (if undefined, the top-left of the rectangle is used)
    Scale: (
      rectangle: DeepReadonly<IRectangle>,
      scalar: number | IPoint,
      center?: DeepReadonly<IPoint>
    ): IRectangle => {
      if (scalar === 1) return rectangle;

      const position = center
        ? Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(rectangle, center), scalar), center)
        : rectangle;

      return typeof scalar === 'number'
        ? {
            x: position.x,
            y: position.y,
            w: rectangle.w * scalar,
            h: rectangle.h * scalar,
          }
        : {
            x: position.x,
            y: position.y,
            w: rectangle.w * scalar.x,
            h: rectangle.h * scalar.y,
          };
    },
    Expand: (rectangle: DeepReadonly<IRectangle>, wAmount: number, hAmount: number = wAmount): IRectangle => ({
      x: rectangle.x - wAmount,
      y: rectangle.y - hAmount,
      w: rectangle.w + 2 * wAmount,
      h: rectangle.h + 2 * hAmount,
    }),
    RandomPointInside: (rectangle: DeepReadonly<IRectangle>, _rng?: RNG): IPoint => ({
      x: rectangle.x + (_rng ?? rng)?.random() * rectangle.w,
      y: rectangle.y + (_rng ?? rng)?.random() * rectangle.h,
    }),
    // Returns the closest point to "position" that is on or outside of "rectangle"
    ClosestPointOutside: (rectangle: DeepReadonly<IRectangle>, position: IPoint): IPoint => {
      if (!Geometry.Collide.RectanglePoint(rectangle, position)) return { x: position.x, y: position.y };
      const yTopDiff = Math.abs(position.y - rectangle.y);
      const yBottomDiff = Math.abs(rectangle.y + rectangle.h - position.y);
      const xLeftDiff = Math.abs(position.x - rectangle.x);
      const xRightDiff = Math.abs(rectangle.x + rectangle.w - position.x);
      const min = Math.min(yTopDiff, yBottomDiff, xLeftDiff, xRightDiff);
      if (min == yTopDiff) {
        return { x: position.x, y: rectangle.y };
      } else if (min == yBottomDiff) {
        return { x: position.x, y: rectangle.y + rectangle.h };
      } else if (min == xLeftDiff) {
        return { x: rectangle.x, y: position.y };
      }
      return { x: rectangle.x + rectangle.w, y: position.y };
    },
    // Returns the closest point to "position" that is on or inside of "rectangle"
    ClosestPointInside: (rectangle: DeepReadonly<IRectangle>, position: IPoint): IPoint => ({
      x: clamp(position.x, rectangle.x, rectangle.x + rectangle.w),
      y: clamp(position.y, rectangle.y, rectangle.y + rectangle.h),
    }),
    Square: (center: DeepReadonly<IPoint>, sideLength: number): IRectangle => ({
      x: center.x - sideLength / 2,
      y: center.y - sideLength / 2,
      w: sideLength,
      h: sideLength,
    }),
    Translate: (rectangle: DeepReadonly<IRectangle>, translation: DeepReadonly<IPoint>): IRectangle => ({
      x: rectangle.x + translation.x,
      y: rectangle.y + translation.y,
      w: rectangle.w,
      h: rectangle.h,
    }),
    Align: (rectangle: DeepReadonly<IRectangle>, halign: Halign, valign: Valign): IRectangle => {
      const offset = { x: 0, y: 0 };
      switch (halign) {
        case Halign.CENTER:
          offset.x -= rectangle.w / 2;
          break;
        case Halign.RIGHT:
          offset.x -= rectangle.w;
          break;
        case Halign.LEFT:
        default:
          break;
      }
      switch (valign) {
        case Valign.MIDDLE:
          offset.y -= rectangle.h / 2;
          break;
        case Valign.BOTTOM:
          offset.y -= rectangle.h;
          break;
        case Valign.TOP:
        default:
          break;
      }
      return Geometry.Rectangle.Translate(rectangle, offset);
    },
    Center: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
      x: rectangle.x + rectangle.w / 2,
      y: rectangle.y + rectangle.h / 2,
    }),
    TopLeft: (rectangle: DeepReadonly<IRectangle>): IPoint => rectangle,
    TopRight: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
      x: rectangle.x + rectangle.w,
      y: rectangle.y,
    }),
    BottomLeft: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
      x: rectangle.x,
      y: rectangle.y + rectangle.h,
    }),
    BottomRight: (rectangle: DeepReadonly<IRectangle>): IPoint => ({
      x: rectangle.x + rectangle.w,
      y: rectangle.y + rectangle.h,
    }),
    xLeft: (rectangle: DeepReadonly<IRectangle>): number => rectangle.x,
    xRight: (rectangle: DeepReadonly<IRectangle>): number => rectangle.x + rectangle.w,
    yTop: (rectangle: DeepReadonly<IRectangle>) => rectangle.y,
    yBottom: (rectangle: DeepReadonly<IRectangle>) => rectangle.y + rectangle.h,
  };

  public static Circle: ICircleStatic = {
    Circumcircle: (circle: DeepReadonly<ICircle>): ICircle => circle,
    Supertriangle: (circle: DeepReadonly<ICircle>): ITriangle => ({
      a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, circle.r * 2), circle),
      b: Geometry.Point.Add(
        Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau / 3), circle.r * 2),
        circle
      ),
      c: Geometry.Point.Add(
        Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, (tau * 2) / 3), circle.r * 2),
        circle
      ),
    }),
    Bounds: (circle: DeepReadonly<ICircle>): IRectangle => {
      const temp = { x: 0, y: 0, w: 0, h: 0 };
      Geometry.Circle.SetRectangleToBounds(circle, temp);
      return temp;
    },
    SetRectangleToBounds: (circle: DeepReadonly<ICircle>, rectangle: IRectangle): void => {
      rectangle.x = circle.x - circle.r;
      rectangle.y = circle.y - circle.r;
      rectangle.w = circle.r * 2;
      rectangle.h = circle.r * 2;
    },
    Midpoint: (circle: DeepReadonly<ICircle>): IPoint => circle,
    Area: (circle: DeepReadonly<ICircle>): number => Math.PI * circle.r * circle.r,
    Circumference: (circle: DeepReadonly<ICircle>): number => tau * circle.r,
    Hash: (circle: DeepReadonly<ICircle>): string =>
      `${Geometry.Point.Hash(circle)},${circle.r.toFixed(Geometry.HashDecimalDigits)}`,
    RandomPointInside: (circle: DeepReadonly<ICircle>, _rng?: RNG): IPoint =>
      Geometry.Point.Add(
        circle,
        Geometry.Point.Vector(circle.r * (_rng ?? rng)?.random(), tau * (_rng ?? rng)?.random())
      ),
    Translate: (circle: DeepReadonly<ICircle>, translation: DeepReadonly<IPoint>): ICircle => ({
      x: circle.x + translation.x,
      y: circle.y + translation.y,
      r: circle.r,
    }),
    Rotate: (circle: DeepReadonly<ICircle>, angle: number, center?: DeepReadonly<IPoint>): ICircle => ({
      ...Geometry.Point.Rotate(circle, angle, center),
      r: circle.r,
    }),
    TangentPoints: (circle: DeepReadonly<ICircle>, point: DeepReadonly<IPoint>): { a: IPoint; b: IPoint } | null => {
      const distanceSq = Geometry.Point.DistanceSq(circle, point);
      if (distanceSq <= 0 || circle.r <= 0 || distanceSq < circle.r * circle.r) return null;
      const angle = Geometry.Point.Angle(Geometry.Point.Subtract(point, circle));
      const angleDiff = Math.acos(circle.r / Math.sqrt(distanceSq));
      return {
        a: Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r, angle + angleDiff)),
        b: Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r, angle - angleDiff)),
      };
    },
  };

  public static Triangle: ITriangleStatic = {
    Segments: (triangle: DeepReadonly<ITriangle>, offset: DeepReadonly<IPoint> = Geometry.Point.Zero): ISegment[] =>
      Geometry.Points.Segments(Geometry.Triangle.Vertices(triangle, offset)),
    Vertices: (triangle: DeepReadonly<ITriangle>, offset: DeepReadonly<IPoint> = Geometry.Point.Zero): IPoint[] => [
      { x: triangle.a.x + offset.x, y: triangle.a.y + offset.y },
      { x: triangle.b.x + offset.x, y: triangle.b.y + offset.y },
      { x: triangle.c.x + offset.x, y: triangle.c.y + offset.y },
    ],
    Circumcircle: (triangle: DeepReadonly<ITriangle>): ICircle => {
      const intersection = Geometry.Intersection.LineLine(
        Geometry.Segment.PerpendicularBisector({
          a: triangle.a,
          b: triangle.b,
        }),
        Geometry.Segment.PerpendicularBisector({ a: triangle.b, b: triangle.c })
      );
      if (!intersection) throw 'No intersection found!';

      return {
        x: intersection.x,
        y: intersection.y,
        r: Geometry.Point.Distance(triangle.a, intersection),
      };
    },
    Supertriangle: (triangle: DeepReadonly<ITriangle>): ITriangle => triangle,
    Triangulation: (triangle: DeepReadonly<ITriangle>): ITriangle[] => [triangle],
    Bounds: (triangle: DeepReadonly<ITriangle>): IRectangle =>
      Geometry.Points.Bounds(Geometry.Triangle.Vertices(triangle)),
    SetRectangleToBounds: (triangle: DeepReadonly<ITriangle>, rectangle: IRectangle): void =>
      Geometry.Points.SetRectangleToBounds(Geometry.Triangle.Vertices(triangle), rectangle),
    Midpoint: (triangle: DeepReadonly<ITriangle>): IPoint =>
      Geometry.Point.Midpoint(...Geometry.Triangle.Vertices(triangle))!,
    Area: (triangle: DeepReadonly<ITriangle>): number => Math.abs(Geometry.Triangle.AreaSigned(triangle)),
    AreaSigned: (triangle: DeepReadonly<ITriangle>): number =>
      0.5 *
      (-triangle.b.y * triangle.c.x +
        triangle.a.y * (-triangle.b.x + triangle.c.x) +
        triangle.a.x * (triangle.b.y - triangle.c.y) +
        triangle.b.x * triangle.c.y),
    Perimeter: (triangle: DeepReadonly<ITriangle>): number =>
      Geometry.Triangle.LengthAB(triangle) +
      Geometry.Triangle.LengthBC(triangle) +
      Geometry.Triangle.LengthCA(triangle),
    Semiperimeter: (triangle: DeepReadonly<ITriangle>): number => Geometry.Triangle.Perimeter(triangle) / 2,
    Hash: (triangle: DeepReadonly<ITriangle>): string => Geometry.Points.Hash(Geometry.Triangle.Vertices(triangle)),
    Incenter: (triangle: DeepReadonly<ITriangle>): IPoint => {
      const bisectorA = Geometry.Triangle.AngleBisectorA(triangle);
      const bisectorB = Geometry.Triangle.AngleBisectorB(triangle);
      const intersection = Geometry.Intersection.RayRay(bisectorA, bisectorB);
      if (!intersection)
        throw `No intersection found between angle bisectors of points "a" and "b" in triangle (${triangle.a}, ${triangle.b}, ${triangle.c}`;
      return intersection;
    },
    Inradius: (triangle: DeepReadonly<ITriangle>): number => {
      const lengthAB = Geometry.Triangle.LengthAB(triangle);
      const lengthBC = Geometry.Triangle.LengthBC(triangle);
      const lengthCA = Geometry.Triangle.LengthCA(triangle);
      const s = (lengthAB + lengthBC + lengthCA) / 2;
      return Math.sqrt(s * (s - lengthAB) * (s - lengthBC) * (s - lengthCA)) / s;
    },
    InscribedCircle: (triangle: DeepReadonly<ITriangle>): ICircle => {
      const { x, y } = Geometry.Triangle.Incenter(triangle);
      const radius = Geometry.Triangle.Inradius(triangle);
      return { x, y, r: radius };
    },
    AngleA: (triangle: DeepReadonly<ITriangle>): number => {
      const angleAB = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.b, triangle.a));
      const angleAC = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.c, triangle.a));
      return Math.abs(angleAC - angleAB);
    },
    AngleB: (triangle: DeepReadonly<ITriangle>): number => {
      const angleBC = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.c, triangle.b));
      const angleBA = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.a, triangle.b));
      return Math.abs(angleBA - angleBC);
    },
    AngleC: (triangle: DeepReadonly<ITriangle>): number => {
      const angleCA = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.a, triangle.c));
      const angleCB = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.b, triangle.c));
      return Math.abs(angleCB - angleCA);
    },
    LengthAB: (triangle: DeepReadonly<ITriangle>): number => Geometry.Point.Distance(triangle.a, triangle.b),
    LengthBC: (triangle: DeepReadonly<ITriangle>): number => Geometry.Point.Distance(triangle.b, triangle.c),
    LengthCA: (triangle: DeepReadonly<ITriangle>): number => Geometry.Point.Distance(triangle.c, triangle.a),
    // returns the angle bisector of a given vertex ( vertices ordered: a => b => c )
    AngleBisector: (
      bisectionVertex: DeepReadonly<IPoint>,
      previousVertex: DeepReadonly<IPoint>,
      nextVertex: DeepReadonly<IPoint>
    ): IRay => {
      const angleAB = Geometry.Point.Angle(Geometry.Point.Subtract(nextVertex, bisectionVertex));
      const angleAC = Geometry.Point.Angle(Geometry.Point.Subtract(previousVertex, bisectionVertex));
      const angleBisector = moduloSafe(Geometry.AngleDifference(angleAC, angleAB) / 2 + angleAB, tau);
      return {
        a: bisectionVertex,
        b: Geometry.Point.Add(bisectionVertex, Geometry.Point.Vector(1, angleBisector)),
      };
    },
    AngleBisectorA: ({ a, b, c }: DeepReadonly<ITriangle>): IRay => Geometry.Triangle.AngleBisector(a, c, b),
    AngleBisectorB: ({ a, b, c }: DeepReadonly<ITriangle>): IRay => Geometry.Triangle.AngleBisector(b, a, c),
    AngleBisectorC: ({ a, b, c }: DeepReadonly<ITriangle>): IRay => Geometry.Triangle.AngleBisector(c, b, a),
    PerpendicularBisectorAB: (triangle: DeepReadonly<ITriangle>): ILine =>
      Geometry.Segment.PerpendicularBisector({ a: triangle.a, b: triangle.b }),
    PerpendicularBisectorBC: (triangle: DeepReadonly<ITriangle>): ILine =>
      Geometry.Segment.PerpendicularBisector({ a: triangle.b, b: triangle.c }),
    PerpendicularBisectorCA: (triangle: DeepReadonly<ITriangle>): ILine =>
      Geometry.Segment.PerpendicularBisector({ a: triangle.c, b: triangle.a }),
    Translate: (triangle: DeepReadonly<ITriangle>, position: DeepReadonly<IPoint>): ITriangle => ({
      a: Geometry.Point.Add(triangle.a, position),
      b: Geometry.Point.Add(triangle.b, position),
      c: Geometry.Point.Add(triangle.c, position),
    }),
    Rotate: ({ a, b, c }: DeepReadonly<ITriangle>, angle: number, center?: DeepReadonly<IPoint>) => ({
      a: Geometry.Point.Rotate(a, angle, center),
      b: Geometry.Point.Rotate(b, angle, center),
      c: Geometry.Point.Rotate(c, angle, center),
    }),
  };

  public static Polygon: IPolygonStatic = {
    Explicit: {
      WindingNumber: (polygon: DeepReadonly<IPolygon>, px: number, py: number): number => {
        // https://twitter.com/FreyaHolmer/status/1232826293902888960
        // http://geomalgorithms.com/a03-_inclusion.html
        let windingNumber = 0;
        for (let i = 0; i < polygon.vertices.length; i++) {
          const currentVertex = polygon.vertices[i];
          const nextVertex = polygon.vertices[(i + 1) % polygon.vertices.length];
          if (currentVertex.y <= py) {
            if (nextVertex.y > py) {
              if (Geometry.IsLeftOf(px, py, currentVertex.x, currentVertex.y, nextVertex.x, nextVertex.y)) {
                windingNumber++;
              }
            }
          } else {
            if (nextVertex.y <= py) {
              if (Geometry.IsRightOf(px, py, currentVertex.x, currentVertex.y, nextVertex.x, nextVertex.y)) {
                windingNumber--;
              }
            }
          }
        }
        return windingNumber;
      },
    },
    Segments: (polygon: DeepReadonly<IPolygon>, offset?: DeepReadonly<IPoint>): ISegment[] =>
      Geometry.Points.Segments(offset ? Geometry.Polygon.Vertices(polygon, offset) : polygon.vertices),
    Vertices: (polygon: DeepReadonly<IPolygon>, offset: DeepReadonly<IPoint> = Geometry.Point.Zero): IPoint[] =>
      polygon.vertices.map(o => ({ x: o.x + offset.x, y: o.y + offset.y })),
    Circumcircle: (polygon: DeepReadonly<IPolygon>): ICircle | null => Geometry.Points.Circumcircle(polygon.vertices),
    Supertriangle: (polygon: DeepReadonly<IPolygon>): ITriangle | null =>
      Geometry.Points.Supertriangle(polygon.vertices),
    Triangulation: (polygon: DeepReadonly<IPolygon>): ITriangle[] => Geometry.Points.Triangulation(polygon.vertices),
    Bounds: (polygon: DeepReadonly<IPolygon>): IRectangle => Geometry.Points.Bounds(polygon.vertices),
    SetRectangleToBounds: (polygon: DeepReadonly<IPolygon>, rectangle: IRectangle): void =>
      Geometry.Points.SetRectangleToBounds(polygon.vertices, rectangle),
    Midpoint: (polygon: DeepReadonly<IPolygon>): IPoint | null => Geometry.Point.Midpoint(...polygon.vertices),
    Area: (polygon: DeepReadonly<IPolygon>): number =>
      Geometry.Polygon.Triangulation(polygon)
        .map(o => Geometry.Triangle.Area(o))
        .sum() ?? 0,
    Rotate: (polygon: DeepReadonly<IPolygon>, angle: number, center?: DeepReadonly<IPoint>): IPolygon => ({
      vertices: polygon.vertices.map(o => Geometry.Point.Rotate(o, angle, center)),
    }),
    Translate: (polygon: DeepReadonly<IPolygon>, position: DeepReadonly<IPoint>): IPolygon => ({
      vertices: polygon.vertices.map(o => Geometry.Point.Add(o, position)),
    }),
    Hash: (polygon: DeepReadonly<IPolygon>): string => Geometry.Points.Hash(polygon.vertices),
    WindingNumber: (polygon: DeepReadonly<IPolygon>, point: DeepReadonly<IPoint>): number =>
      Geometry.Polygon.Explicit.WindingNumber(polygon, point.x, point.y),
    GetRegularPolygonPoints: (radius: number, sides: number, angle: number = 0): IPolygon => {
      const vertices: IPoint[] = [];
      for (let i = 0; i < sides; i++) vertices.push(Geometry.Point.Vector(radius, (tau * i) / sides + angle));
      return { vertices };
    },
  };

  public static PointPair = {
    YatX: (pair: DeepReadonly<IPointPair>, x: number): number => {
      const slope = Geometry.Line.Slope(pair);
      return slope === Number.POSITIVE_INFINITY
        ? Number.POSITIVE_INFINITY
        : slope === Number.NEGATIVE_INFINITY
        ? Number.NEGATIVE_INFINITY
        : pair.a.y + (x - pair.a.x) * slope;
    },
    XatY: (pair: DeepReadonly<IPointPair>, y: number): number => {
      const slope = Geometry.Line.Slope(pair);
      return slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY
        ? pair.a.x
        : pair.a.x + (y - pair.a.y) / slope;
    },
    Slope: (pair: DeepReadonly<IPointPair>): number =>
      pair.b.x !== pair.a.x
        ? (pair.b.y - pair.a.y) / (pair.b.x - pair.a.x)
        : pair.b.y > pair.a.y
        ? Number.NEGATIVE_INFINITY
        : Number.POSITIVE_INFINITY,
  };

  public static Segment: ISegmentStatic = {
    AreEqual: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>): boolean =>
      Geometry.Segment.Hash(segmentA) === Geometry.Segment.Hash(segmentB),
    YatX: (segment: DeepReadonly<ISegment>, x: number): number | null =>
      Math.sign(x - segment.a.x) * Math.sign(segment.b.x - segment.a.x) === -1 &&
      Math.sign(x - segment.b.x) * Math.sign(segment.a.x - segment.b.x) === -1
        ? Geometry.PointPair.YatX(segment, x)
        : null,
    XatY: (segment: DeepReadonly<ISegment>, y: number): number | null =>
      Math.sign(y - segment.a.y) * Math.sign(segment.b.y - segment.a.y) === -1 &&
      Math.sign(y - segment.b.y) * Math.sign(segment.a.y - segment.b.y) === -1
        ? Geometry.PointPair.XatY(segment, y)
        : null,
    Slope: (segment: DeepReadonly<ISegment>): number => Geometry.PointPair.Slope(segment),
    Hash: (segment: DeepReadonly<ISegment>): string => Geometry.Points.Hash([segment.a, segment.b]),
    Translate: (segment: DeepReadonly<ISegment>, offset: DeepReadonly<IPoint>) => ({
      a: Geometry.Point.Add(segment.a, offset),
      b: Geometry.Point.Add(segment.b, offset),
    }),
    ClosestPointTo: ({ a, b }: DeepReadonly<ISegment>, point: DeepReadonly<IPoint>): IPoint => {
      const ab = Geometry.Point.Subtract(b, a);
      const ret = Geometry.Point.Add(Geometry.Point.Project(Geometry.Point.Subtract(point, a), ab), a);
      const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
      if (r < 0) return a;
      if (r > Geometry.Point.LengthSq(ab)) return b;
      return ret;
    },
    Midpoint: (segment: DeepReadonly<ISegment>): IPoint => ({
      x: (segment.a.x + segment.b.x) / 2,
      y: (segment.a.y + segment.b.y) / 2,
    }),
    PerpendicularBisector: (segment: DeepReadonly<ISegment>): ILine => {
      const midpoint = Geometry.Segment.Midpoint(segment);
      return {
        a: midpoint,
        b: Geometry.Point.Add(midpoint, Geometry.Point.Rotate(Geometry.Point.Subtract(segment.b, segment.a), angle90)),
      };
    },
    SharedVertex: (segmentA: DeepReadonly<ISegment>, segmentB: DeepReadonly<ISegment>): IPoint | null =>
      Geometry.Point.AreEqual(segmentA.a, segmentB.a) || Geometry.Point.AreEqual(segmentA.a, segmentB.b)
        ? segmentA.a
        : Geometry.Point.AreEqual(segmentA.b, segmentB.a) || Geometry.Point.AreEqual(segmentA.b, segmentB.b)
        ? segmentA.b
        : null,
    Bounds: (segment: DeepReadonly<ISegment>): IRectangle => {
      const temp = { x: 0, y: 0, w: 0, h: 0 };
      Geometry.Segment.SetRectangleToBounds(segment, temp);
      return temp;
    },
    SetRectangleToBounds: (segment: DeepReadonly<ISegment>, rectangle: IRectangle): void => {
      rectangle.x = Math.min(segment.a.x, segment.b.x);
      rectangle.y = Math.min(segment.a.y, segment.b.y);
      rectangle.w = Math.max(segment.a.x, segment.b.x) - rectangle.x;
      rectangle.h = Math.max(segment.a.y, segment.b.y) - rectangle.y;
    },
  };

  public static Ray: IRayStatic = {
    Explicit: {
      ClosestPointXTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number): number => {
        const abx = bx - ax;
        const aby = by - ay;
        const apx = xTest - ax;
        const apy = yTest - ay;
        const xProj = Geometry.ProjectX(apx, apy, abx, aby);
        const yProj = Geometry.ProjectY(apx, apy, abx, aby);
        const dot = Geometry.Dot(xProj, yProj, abx, aby);
        return dot < 0 ? ax : xProj + ax;
      },
      ClosestPointYTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number): number => {
        const abx = bx - ax;
        const aby = by - ay;
        const apx = xTest - ax;
        const apy = yTest - ay;
        const xProj = Geometry.ProjectX(apx, apy, abx, aby);
        const yProj = Geometry.ProjectY(apx, apy, abx, aby);
        const dot = Geometry.Dot(xProj, yProj, abx, aby);
        return dot < 0 ? ay : yProj + ay;
      },
    },
    AreEqual: (rayA: DeepReadonly<IRay>, rayB: DeepReadonly<IRay>): boolean =>
      Geometry.Ray.Hash(rayA) === Geometry.Ray.Hash(rayB),
    YatX: (ray: DeepReadonly<IRay>, x: number): number | null =>
      Math.sign(x - ray.a.x) * Math.sign(ray.b.x - ray.a.x) === -1 ? null : Geometry.PointPair.YatX(ray, x),
    XatY: (ray: DeepReadonly<IRay>, y: number): number | null =>
      Math.sign(y - ray.a.y) * Math.sign(ray.b.y - ray.a.y) === -1 ? null : Geometry.PointPair.XatY(ray, y),
    Slope: (ray: DeepReadonly<IRay>): number => Geometry.PointPair.Slope(ray),
    Hash: (ray: DeepReadonly<IRay>): string =>
      Geometry.Points.Hash([
        ray.a,
        Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a)), ray.a),
      ]),
    DefaultMaxDistance: 1000000,
    AsSegment: (ray: DeepReadonly<IRay>, length: number = Geometry.Ray.DefaultMaxDistance): ISegment => ({
      a: ray.a,
      b: Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a),
    }),
    PointAtDistance: (ray: DeepReadonly<IRay>, length: number = Geometry.Ray.DefaultMaxDistance): IPoint => {
      return Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a);
    },
    Cast: (
      ray: DeepReadonly<IRay>,
      segments: DeepReadonly<DeepReadonly<ISegment>[]>,
      maxDistance: number = Geometry.Ray.DefaultMaxDistance
    ): IRaycastResult<ISegment> | null => {
      const raySegment = Geometry.Ray.AsSegment(ray, maxDistance);
      const segmentIntersection = segments
        .map(segment => ({
          segment,
          intersection: Geometry.Intersection.SegmentSegment(raySegment, segment),
        }))
        .filter(({ segment, intersection }) => intersection != null && segment != null)
        .minOf(({ intersection }) => Geometry.Point.DistanceSq(intersection!, ray.a));
      return segmentIntersection == null || segmentIntersection.intersection == null
        ? null
        : {
            contactPoint: segmentIntersection.intersection,
            segmentHit: segmentIntersection.segment,
          };
    },
    Translate: (ray: DeepReadonly<IRay>, offset: DeepReadonly<IPoint>) => ({
      a: Geometry.Point.Add(ray.a, offset),
      b: Geometry.Point.Add(ray.b, offset),
    }),
    ClosestPointTo: ({ a, b }: DeepReadonly<IRay>, point: DeepReadonly<IPoint>): IPoint => {
      const ab = Geometry.Point.Subtract(b, a);
      const ret = Geometry.Point.Add(Geometry.Point.Project(Geometry.Point.Subtract(point, a), ab), a);
      const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
      return r < 0 ? a : ret;
    },
  };

  public static Line: ILineStatic = {
    Explicit: {
      ClosestPointXTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number): number =>
        ax + Geometry.ProjectX(xTest - ax, yTest - ay, bx - ax, by - ay),
      ClosestPointYTo: (ax: number, ay: number, bx: number, by: number, xTest: number, yTest: number): number =>
        ay + Geometry.ProjectY(xTest - ax, yTest - ay, bx - ax, by - ay),
    },
    AreEqual: (lineA: DeepReadonly<ILine>, lineB: DeepReadonly<ILine>): boolean =>
      Geometry.Line.Hash(lineA) === Geometry.Line.Hash(lineB),
    YatX: (line: DeepReadonly<ILine>, x: number): number => Geometry.PointPair.YatX(line, x),
    XatY: (line: DeepReadonly<ILine>, y: number): number => Geometry.PointPair.XatY(line, y),
    Slope: (line: DeepReadonly<ILine>): number => Geometry.PointPair.Slope(line),
    Hash: (line: DeepReadonly<ILine>): string =>
      `${Geometry.Line.Slope(line).toFixed(6)}${Geometry.Line.YatX(line, 0).toFixed(6)}`,
    Translate: (line: DeepReadonly<ILine>, offset: DeepReadonly<IPoint>) => ({
      a: Geometry.Point.Add(line.a, offset),
      b: Geometry.Point.Add(line.b, offset),
    }),
    ClosestPointTo: (line: DeepReadonly<ILine>, point: DeepReadonly<IPoint>): IPoint =>
      Geometry.Point.Add(
        line.a,
        Geometry.Point.Project(Geometry.Point.Subtract(point, line.a), Geometry.Point.Subtract(line.b, line.a))
      ),
    Yintercept: (line: DeepReadonly<ILine>): number => Geometry.Line.YatX(line, 0),
  };

  public static Point: IPointStatic = {
    Zero: { x: 0, y: 0 },
    One: { x: 1, y: 1 },
    Up: { x: 0, y: -1 },
    Down: { x: 0, y: 1 },
    Left: { x: -1, y: 0 },
    Right: { x: 1, y: 0 },
    UpRight: { x: 1, y: -1 },
    UpLeft: { x: -1, y: -1 },
    DownRight: { x: 1, y: 1 },
    DownLeft: { x: -1, y: 1 },
    CardinalDirections: [
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
    ],
    AreEqual: (a?: DeepReadonly<IPoint> | null, b?: DeepReadonly<IPoint> | null) => {
      if (a == null && b == null) return true;
      if (a == null || b == null) return false;
      return Geometry.IsWithinToleranceOf(Geometry.Point.DistanceSq(a, b));
    },
    Hash: (point: DeepReadonly<IPoint>) =>
      `${point.x.toFixed(Geometry.HashDecimalDigits)},${point.y.toFixed(Geometry.HashDecimalDigits)}`,
    DistanceSq: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => Geometry.DistanceSq(a.x, a.y, b.x, b.y),
    Distance: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => Math.sqrt(Geometry.Point.DistanceSq(a, b)),
    Add: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => ({
      x: a.x + b.x,
      y: a.y + b.y,
    }),
    Translate: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => ({
      x: a.x + b.x,
      y: a.y + b.y,
    }),
    Subtract: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => ({
      x: a.x - b.x,
      y: a.y - b.y,
    }),
    Midpoint: (...points: DeepReadonly<DeepReadonly<IPoint>[]>): IPoint | null => {
      if (points.length <= 0) return null;
      const sum = { x: 0, y: 0 };
      points.forEach(point => {
        sum.x += point.x;
        sum.y += point.y;
      });
      return {
        x: sum.x / points.length,
        y: sum.y / points.length,
      };
    },
    Angle: (point: DeepReadonly<IPoint>): number => Math.atan2(point.y, point.x),
    AngleTo: (to: DeepReadonly<IPoint>, from: DeepReadonly<IPoint>): number => Math.atan2(to.y - from.y, to.x - from.x),
    Scale: (point: DeepReadonly<IPoint>, scalar: number | IPoint, from?: DeepReadonly<IPoint>): IPoint => {
      return from != null
        ? typeof scalar === 'number'
          ? {
              x: (point.x - from.x) * scalar + from.x,
              y: (point.y - from.y) * scalar + from.y,
            }
          : {
              x: (point.x - from.x) * scalar.x + from.x,
              y: (point.y - from.y) * scalar.y + from.y,
            }
        : typeof scalar === 'number'
        ? { x: point.x * scalar, y: point.y * scalar }
        : { x: point.x * scalar.x, y: point.y * scalar.y };
    },
    LengthSq: (point: DeepReadonly<IPoint>): number => point.x * point.x + point.y * point.y,
    Length: (point: DeepReadonly<IPoint>): number => Math.sqrt(Geometry.Point.LengthSq(point)),
    Dot: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => Geometry.Dot(a.x, a.y, b.x, b.y),
    Cross: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number => a.x * b.y - b.x * a.y,
    Project: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): IPoint => {
      return Geometry.Point.Scale(
        b,
        Geometry.Point.Dot(a, b) / Math.max(Geometry.Point.LengthSq(b), Geometry.Tolerance)
      );
    },
    Normalized: (point: DeepReadonly<IPoint>, length?: number): IPoint => {
      if ((point.x === 0 && point.y === 0) || length === 0) return { x: 0, y: 0 };
      const temp = (length == undefined ? 1 : length) / Geometry.Point.Length(point);
      return { x: point.x * temp, y: point.y * temp };
    },
    Rotate: (point: DeepReadonly<IPoint>, angle: number, center?: DeepReadonly<IPoint>): IPoint => ({
      x: Geometry.RotateX(point.x, point.y, angle, center?.x, center?.y),
      y: Geometry.RotateY(point.x, point.y, angle, center?.x, center?.y),
    }),
    // same as rotating a vector 180 degrees
    Negative: (point: DeepReadonly<IPoint>): IPoint => ({
      x: -point.x,
      y: -point.y,
    }),
    // rotates the point randomly in the range given about the center, or the origin if it is not defined
    Wiggle: (point: DeepReadonly<IPoint>, angleRangeMax: number, center?: DeepReadonly<IPoint>, _rng?: RNG): IPoint =>
      Geometry.Point.Rotate(point, angleRangeMax * ((_rng ?? rng)?.random() - 0.5), center),
    // Returns how much a (as a vector) faces in the direction of b (as a vector)
    // -1 = a faces opposite the direction of b
    // 0 = a faces perpendicular to the direction of b
    // 1 = a faces the exact same direction as b
    Towardness: (a: DeepReadonly<IPoint>, b: DeepReadonly<IPoint>): number =>
      Geometry.Point.Dot(Geometry.Point.Normalized(a), Geometry.Point.Normalized(b)),
    // t = 0 =  from
    // t = 0.5 = midpoint between from and to
    // t = 1 = to
    Lerp: (from: DeepReadonly<IPoint>, to: DeepReadonly<IPoint>, t: number): IPoint =>
      Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(to, from), t), from),
    // returns a version of this point which is flipped over (rotated 180 degrees around) the given point
    // (or the origin if none is provided). Provided because it is faster than using rotate/reflect.
    Flip: (point: DeepReadonly<IPoint>, center?: DeepReadonly<IPoint>): IPoint => {
      return center ? { x: 2 * center.x - point.x, y: 2 * center.y - point.y } : Geometry.Point.Negative(point);
    },
    // reflects the given point over the given line
    Reflect: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IPointPair>): IPoint => {
      // use the Line method for Rays & Segments too
      const reflectionPoint = Geometry.Line.ClosestPointTo(pair, point);
      return Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(reflectionPoint, point), 2), point);
    },
    ClampedInRectangle: (point: DeepReadonly<IPoint>, rectangle: DeepReadonly<IRectangle>): IPoint => ({
      x: clamp(point.x, rectangle.x, rectangle.x + rectangle.w),
      y: clamp(point.y, rectangle.y, rectangle.y + rectangle.h),
    }),
    Vector: (length: number, angle: number): IPoint => ({
      x: Math.cos(angle) * length,
      y: Math.sin(angle) * length,
    }),
    UnitVector: (angle: number): IPoint => Geometry.Point.Vector(1, angle),
    // if result is > 0, then this point is left of the line/segment/ray formed by the two points.
    // if result is < 0, then this point is right of the line/segment/ray formed by the two points.
    // if result == 0, then it is colinear with the two points.
    IsLeftCenterRightOf: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>): number =>
      Geometry.IsLeftCenterRightOf(point.x, point.y, a.x, a.y, b.x, b.y),
    IsLeftOf: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>): boolean =>
      Geometry.IsLeftOf(point.x, point.y, a.x, a.y, b.x, b.y),
    IsRightOf: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>): boolean =>
      Geometry.IsRightOf(point.x, point.y, a.x, a.y, b.x, b.y),
    IsColinearWith: (point: DeepReadonly<IPoint>, { a, b }: DeepReadonly<IPointPair>): boolean =>
      Geometry.IsColinearWith(point.x, point.y, a.x, a.y, b.x, b.y),
    InsideSegmentIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<ISegment>): boolean =>
      Geometry.InsideSegmentIfColinear(point.x, point.y, pair.a.x, pair.a.y, pair.b.x, pair.b.y),
    InsideRayIfColinear: (point: DeepReadonly<IPoint>, pair: DeepReadonly<IRay>): boolean =>
      Geometry.InsideRayIfColinear(point.x, point.y, pair.a.x, pair.a.y, pair.b.x, pair.b.y),
    // Returns a list of the velocity vectors a projectile would need in order to hit 'target' from 'start'
    // given the speed of the shot and gravity. Returns 0, 1, or 2 Points (if two points, the highest-arching vector is first)
    LaunchVectors: (
      start: DeepReadonly<IPoint>,
      target: DeepReadonly<IPoint>,
      gravityMagnitude: number,
      velocityMagnitude: number
    ) => {
      if (velocityMagnitude === 0) return [];

      const diff = Geometry.Point.Subtract(target, start);
      if (gravityMagnitude === 0) return [Geometry.Point.Normalized(diff, velocityMagnitude)];

      const g = -gravityMagnitude;
      const v = velocityMagnitude;
      const v2 = v * v;
      const sqrt = v2 * v2 - g * (g * diff.x * diff.x + 2 * diff.y * v2);

      if (diff.x === 0 && sqrt === 0) return [Geometry.Point.Vector(Math.sign(diff.x) * v, -angle90)];

      if (diff.x === 0)
        return diff.y > 0
          ? [{ x: 0, y: v }]
          : diff.y < 0
          ? [{ x: 0, y: -v }]
          : [
              { x: 0, y: v },
              { x: 0, y: -v },
            ];

      if (sqrt < 0) return [];

      return [
        Geometry.Point.Vector(Math.sign(diff.x) * v, Math.atan((v2 + Math.sqrt(sqrt)) / (g * diff.x))),
        Geometry.Point.Vector(Math.sign(diff.x) * v, Math.atan((v2 - Math.sqrt(sqrt)) / (g * diff.x))),
      ];
    },
    LaunchVector: (
      start: DeepReadonly<IPoint>,
      target: DeepReadonly<IPoint>,
      gravityMagnitude: number,
      angle: number
    ) => {
      const x0r = start.x;
      const y0r = start.y;
      const x1r = target.x;
      const y1r = target.y;
      const a = gravityMagnitude;

      const xrDiff = x1r - x0r;
      const yrDiff = y1r - y0r;

      const x0 = x0r;
      const y0 = y0r;
      const x1 = x1r;
      const y1 = -yrDiff + y0r;

      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);

      if (Math.sign(cos) != Math.sign(xrDiff)) return null;

      const sqrt = (a * (x1 * x1 - 2 * x1 * x0 + x0 * x0)) / (2 * cos * ((x1 - x0) * sin + (y0 - y1) * cos));
      if (sqrt < 0) return null;

      const v = Math.sqrt(sqrt);
      const vx = v * cos;
      const vy = -v * sin;
      return { x: vx, y: vy };
    },
    LaunchVectorReflective: (
      start: DeepReadonly<IPoint>,
      target: DeepReadonly<IPoint>,
      gravityMagnitude: number,
      angle: number
    ) => {
      const xrDiff = target.x - start.x;
      const x1 = Math.abs(xrDiff) + start.x;
      const y1 = target.y;

      const launchVector = Geometry.Point.LaunchVector(start, { x: x1, y: y1 }, gravityMagnitude, angle);
      return launchVector == null ? null : { x: launchVector.x * Math.sign(xrDiff), y: launchVector.y };
    },
  };

  public static Points: IPointsStatic = {
    Segments: (
      points: DeepReadonly<DeepReadonly<IPoint>[]>,
      offset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      closed: boolean = true
    ): ISegment[] => {
      const segments: ISegment[] = [];
      for (let i = 0; i < points.length; i++) {
        if (i == points.length - 1 && !closed) break;
        const j = (i + 1) % points.length;
        segments.push({
          a: {
            x: points[i].x + offset.x,
            y: points[i].y + offset.y,
          },
          b: {
            x: points[j].x + offset.x,
            y: points[j].y + offset.y,
          },
        });
      }
      return segments;
    },
    Vertices: (
      points: DeepReadonly<DeepReadonly<IPoint>[]>,
      offset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint[] => points.map(o => ({ x: o.x + offset.x, y: o.y + offset.y })),
    Circumcircle: (points: DeepReadonly<DeepReadonly<IPoint>[]>): ICircle | null => {
      // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
      const center = Geometry.Point.Midpoint(...points);
      if (center == null) return null;
      const furthest = points.maxOf(o => Geometry.Point.DistanceSq(center, o));
      if (furthest == null) return null;
      const radius = Geometry.Point.Distance(furthest, center);
      return { x: center.x, y: center.y, r: radius };
    },
    Supertriangle: (points: DeepReadonly<DeepReadonly<IPoint>[]>): ITriangle | null => {
      const circumcircle = Geometry.Points.Circumcircle(points);
      if (circumcircle == null) return null;
      const diameter = circumcircle.r * 2;
      return {
        a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, diameter), circumcircle),
        b: Geometry.Point.Add(
          Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau / 3), diameter),
          circumcircle
        ),
        c: Geometry.Point.Add(
          Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, (tau * 2) / 3), diameter),
          circumcircle
        ),
      };
    },
    Triangulation: (points: DeepReadonly<DeepReadonly<IPoint>[]>): ITriangle[] => {
      // http://paulbourke.net/papers/triangulate/

      // add supertriangle to points and triangles lists
      const supertriangle: ITriangle | null = Geometry.Points.Supertriangle(points);
      if (!supertriangle) return [];
      const supertriangleVertices = Geometry.Triangle.Vertices(supertriangle);
      const triangles: ITriangle[] = [supertriangle];
      const pointsTemp = [...points, ...supertriangleVertices];

      // create new points because they'll be added to the later triangles anyway
      pointsTemp.forEach(point => {
        // find all triangles whose circumcircle collides with the given point, remove them, and aggregate their segments into a list
        const segments: ISegment[] = [];
        triangles.removeWhere(triangle => {
          const circumcircle = Geometry.Triangle.Circumcircle(triangle);
          if (circumcircle) {
            const collides = Geometry.Collide.CirclePoint(circumcircle, point);
            if (collides) {
              segments.push(...Geometry.Triangle.Segments(triangle));
              return true;
            }
          }
          return false;
        });

        // remove all internal segments (those that appear twice in the list)
        segments.removeWhere(segmentA => {
          const hash = Geometry.Segment.Hash(segmentA);
          const equivalentSegments = segments.filter(segmentB => Geometry.Segment.Hash(segmentB) === hash);
          return equivalentSegments.length >= 2;
        });

        // form triangles out of each segment and the given point and add them to the triangles list
        const newTriangles: ITriangle[] = segments
          .filter(
            segment =>
              !Geometry.Point.AreEqual(segment.a, segment.b) &&
              !Geometry.Point.AreEqual(segment.a, point) &&
              !Geometry.Point.AreEqual(segment.b, point)
          )
          .map(segment => ({
            a: segment.b,
            b: segment.a,
            c: point,
          }));
        triangles.push(...newTriangles);
      });

      // remove any triangles that share a vertex with the supertriangle
      triangles.removeWhere(triangle =>
        supertriangleVertices.any(stVertex =>
          Geometry.Triangle.Vertices(triangle).any(vertex => Geometry.Point.AreEqual(stVertex, vertex))
        )
      );

      // return the input list to its original form
      pointsTemp.pop();
      pointsTemp.pop();
      pointsTemp.pop();

      return triangles;
    },
    Bounds: (points: DeepReadonly<DeepReadonly<IPoint>[]>): IRectangle => {
      const temp = { x: 0, y: 0, w: 0, h: 0 };
      Geometry.Points.SetRectangleToBounds(points, temp);
      return temp;
    },
    SetRectangleToBounds: (points: DeepReadonly<DeepReadonly<IPoint>[]>, rectangle: IRectangle): void => {
      if (points == null) {
        rectangle.x = 0;
        rectangle.y = 0;
        rectangle.w = 0;
        rectangle.h = 0;
        return;
      }

      const xMin = points.minOf(o => o.x)?.x ?? 0;
      const yMin = points.minOf(o => o.y)?.y ?? 0;
      const xMax = points.maxOf(o => o.x)?.x ?? 0;
      const yMax = points.maxOf(o => o.y)?.y ?? 0;
      rectangle.x = xMin;
      rectangle.y = yMin;
      rectangle.w = xMax - xMin;
      rectangle.h = yMax - yMin;
    },
    Hash: (points: DeepReadonly<DeepReadonly<IPoint>[]>): string =>
      points
        .clone()
        .sort((a, b) => (a.y == b.y ? a.x - b.x : a.y - b.y))
        .map(o => Geometry.Point.Hash(o))
        .join(';'),
    Translate: (points: DeepReadonly<DeepReadonly<IPoint>[]>, offset: DeepReadonly<IPoint>): IPoint[] =>
      points.map(o => Geometry.Point.Translate(o, offset)),
    Sum: (points: DeepReadonly<DeepReadonly<IPoint>[]>): IPoint => {
      const sum = { x: 0, y: 0 };
      points.forEach(point => {
        sum.x += point.x;
        sum.y += point.y;
      });
      return sum;
    },
    BezierPoint: (points: DeepReadonly<DeepReadonly<IPoint>[]>, t: number): IPoint => {
      const n = points.length - 1;
      let sum = { x: 0, y: 0 };
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const binomial = binomialCoefficient(n, i);
        const scalar = binomial * Math.pow(1 - t, n - i) * Math.pow(t, i);
        const pointToAdd = Geometry.Point.Scale(point, scalar);
        sum.x += pointToAdd.x;
        sum.y += pointToAdd.y;
      }
      return sum;
    },
    // count must be greater than 1
    Bezier: (points: DeepReadonly<DeepReadonly<IPoint>[]>, count: number): IPoint[] => {
      const pointFirst = points.first();
      if (pointFirst == null || count < 1) return [];
      if (count === 1) return [pointFirst];
      const bezierPoints: IPoint[] = [];
      const coarseness = 1 / (count - 1);
      for (let i = 0; i <= 1; i += coarseness) bezierPoints.push(Geometry.Points.BezierPoint(points, i));
      return bezierPoints;
    },
  };

  public static Bounds(shape?: DeepReadonly<BoundableShape>): IRectangle;
  public static Bounds(shape?: DeepReadonly<BoundableShape> | null): IRectangle | null;
  public static Bounds(shape?: DeepReadonly<BoundableShape> | null): IRectangle | null {
    if (shape == null) return null;

    const temp = { x: 0, y: 0, w: 0, h: 0 };
    Geometry.SetRectangleToBounds(shape, temp);
    return temp;
  }

  public static SetRectangleToBounds(shape: DeepReadonly<BoundableShape>, rect: IRectangle): void {
    if (IsRectangle(shape)) {
      Geometry.Rectangle.SetRectangleToBounds(shape, rect);
      return;
    } else if (IsCircle(shape)) {
      Geometry.Circle.SetRectangleToBounds(shape, rect);
      return;
    } else if (IsTriangle(shape)) {
      Geometry.Triangle.SetRectangleToBounds(shape, rect);
      return;
    } else if (IsPolygon(shape)) {
      Geometry.Polygon.SetRectangleToBounds(shape, rect);
      return;
    } else if (IsPath(shape)) {
      Geometry.Points.SetRectangleToBounds(shape, rect);
      return;
    } else if (IsSegment(shape)) {
      Geometry.Segment.SetRectangleToBounds(shape, rect);
      return;
    } else if (IsPoint(shape)) {
      rect.x = shape.x;
      rect.y = shape.y;
      rect.w = 0;
      rect.h = 0;
      return;
    }
    throw new Error('No shape recognized when trying to SetRectangleToBounds');
  }

  public static CollideExplicit = {
    RectangleRectangle: (
      ax: number,
      ay: number,
      aw: number,
      ah: number,
      bx: number,
      by: number,
      bw: number,
      bh: number
    ): boolean => ax + aw > bx && ay + ah > by && ax < bx + bw && ay < by + bh,
    RectangleCircle: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      cx: number,
      cy: number,
      cr: number,
      rectangleAngle: number = 0
    ): boolean => {
      // The rectangle's (x, y) position is its top-left corner if it were not rotated,
      // however the rectangle still rotates about its center (by "rectangleAngle" radians)
      //https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
      const halfW = rw / 2;
      const halfH = rh / 2;

      let circlePositionFinalX = cx;
      let circlePositionFinalY = cy;
      if (rectangleAngle != 0) {
        circlePositionFinalX = Geometry.RotateX(cx, cy, -rectangleAngle, rx + halfW, ry + halfH);
        circlePositionFinalY = Geometry.RotateY(cx, cy, -rectangleAngle, rx + halfW, ry + halfH);
      }
      const xCircleDistance = Math.abs(circlePositionFinalX - (rx + halfW));
      const yCircleDistance = Math.abs(circlePositionFinalY - (ry + halfH));

      if (xCircleDistance > halfW + cr || yCircleDistance > halfH + cr) return false;
      if (xCircleDistance <= halfW || yCircleDistance <= halfH) return true;

      const cornerDistanceSq =
        (xCircleDistance - halfW) * (xCircleDistance - halfW) + (yCircleDistance - halfH) * (yCircleDistance - halfH);
      return cornerDistanceSq <= cr * cr;
    },
    RectangleTriangle: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, rx, ry) ||
      Geometry.CollideExplicit.RectanglePoint(rx, ry, rw, rh, tax, tay) ||
      Geometry.CollideExplicit.SegmentSegment(tax, tay, tbx, tby, rx, ry, rx + rw, ry) ||
      Geometry.CollideExplicit.SegmentSegment(tax, tay, tbx, tby, rx + rw, ry, rx + rw, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(tax, tay, tbx, tby, rx + rw, ry + rh, rx, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(tax, tay, tbx, tby, rx, ry + rh, rx, ry) ||
      Geometry.CollideExplicit.SegmentSegment(tbx, tby, tcx, tcy, rx, ry, rx + rw, ry) ||
      Geometry.CollideExplicit.SegmentSegment(tbx, tby, tcx, tcy, rx + rw, ry, rx + rw, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(tbx, tby, tcx, tcy, rx + rw, ry + rh, rx, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(tbx, tby, tcx, tcy, rx, ry + rh, rx, ry) ||
      Geometry.CollideExplicit.SegmentSegment(tcx, tcy, tax, tay, rx, ry, rx + rw, ry) ||
      Geometry.CollideExplicit.SegmentSegment(tcx, tcy, tax, tay, rx + rw, ry, rx + rw, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(tcx, tcy, tax, tay, rx + rw, ry + rh, rx, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(tcx, tcy, tax, tay, rx, ry + rh, rx, ry),
    RectanglePolygon: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      polygon: DeepReadonly<IPolygon>,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean =>
      polygon.vertices.length > 0 &&
      (Geometry.CollideExplicit.PolygonPoint(polygon, rx, ry, xOffsetPolygon, yOffsetPolygon) ||
        Geometry.CollideExplicit.RectanglePoint(rx, ry, rw, rh, polygon.vertices[0].x, polygon.vertices[0].y) ||
        Geometry.CollideExplicit.PolygonSegment(polygon, rx, ry, rx + rw, ry, xOffsetPolygon, yOffsetPolygon) ||
        Geometry.CollideExplicit.PolygonSegment(
          polygon,
          rx + rw,
          ry,
          rx + rw,
          ry + rh,
          xOffsetPolygon,
          yOffsetPolygon
        ) ||
        Geometry.CollideExplicit.PolygonSegment(
          polygon,
          rx + rw,
          ry + rh,
          rx,
          ry + rh,
          xOffsetPolygon,
          yOffsetPolygon
        ) ||
        Geometry.CollideExplicit.PolygonSegment(polygon, rx, ry + rh, rx, ry, xOffsetPolygon, yOffsetPolygon)),
    RectanglePath: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      path: DeepReadonly<IPath>,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        if (
          Geometry.CollideExplicit.RectangleSegment(
            rx,
            ry,
            rw,
            rh,
            path[i - 1].x + xOffsetPath,
            path[i - 1].y + yOffsetPath,
            path[i].x + xOffsetPath,
            path[i].y + yOffsetPath
          )
        )
          return true;
      }
      return false;
    },
    RectangleSegment: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      ax: number,
      ay: number,
      bx: number,
      by: number
    ): boolean =>
      Geometry.CollideExplicit.RectanglePoint(rx, ry, rw, rh, ax, ay) ||
      Geometry.CollideExplicit.RectanglePoint(rx, ry, rw, rh, bx, by) ||
      Geometry.CollideExplicit.SegmentSegment(ax, ay, bx, by, rx, ry, rx + rw, ry) ||
      Geometry.CollideExplicit.SegmentSegment(ax, ay, bx, by, rx + rw, ry, rx + rw, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(ax, ay, bx, by, rx + rw, ry + rh, rx, ry + rh) ||
      Geometry.CollideExplicit.SegmentSegment(ax, ay, bx, by, rx, ry + rh, rx, ry),
    RectangleLine: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      ax: number,
      ay: number,
      bx: number,
      by: number
    ): boolean =>
      Geometry.CollideExplicit.SegmentLine(rx, ry, rx + rw, ry, ax, ay, bx, by) ||
      Geometry.CollideExplicit.SegmentLine(rx + rw, ry, rx + rw, ry + rh, ax, ay, bx, by) ||
      Geometry.CollideExplicit.SegmentLine(rx + rw, ry + rh, rx, ry + rh, ax, ay, bx, by) ||
      Geometry.CollideExplicit.SegmentLine(rx, ry + rh, rx, ry, ax, ay, bx, by),
    RectangleRay: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      ax: number,
      ay: number,
      bx: number,
      by: number
    ): boolean =>
      Geometry.CollideExplicit.SegmentRay(rx, ry, rx + rw, ry, ax, ay, bx, by) ||
      Geometry.CollideExplicit.SegmentRay(rx + rw, ry, rx + rw, ry + rh, ax, ay, bx, by) ||
      Geometry.CollideExplicit.SegmentRay(rx + rw, ry + rh, rx, ry + rh, ax, ay, bx, by) ||
      Geometry.CollideExplicit.SegmentRay(rx, ry + rh, rx, ry, ax, ay, bx, by),
    RectanglePoint: (ax: number, ay: number, aw: number, ah: number, bx: number, by: number): boolean =>
      bx >= ax && by >= ay && bx < ax + aw && by < ay + ah,
    CircleCircle: (ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean =>
      (ax - bx) * (ax - bx) + (ay - by) * (ay - by) <= (ar + br) * (ar + br),
    CircleTriangle: (
      cx: number,
      cy: number,
      cr: number,
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, cx, cy) ||
      Geometry.CollideExplicit.CirclePoint(cx, cy, cr, tax, tay) ||
      Geometry.CollideExplicit.CircleSegment(cx, cy, cr, tax, tay, tbx, tby) ||
      Geometry.CollideExplicit.CircleSegment(cx, cy, cr, tbx, tby, tcx, tcy) ||
      Geometry.CollideExplicit.CircleSegment(cx, cy, cr, tcx, tcy, tax, tay),
    CirclePolygon: (
      cx: number,
      cy: number,
      cr: number,
      polygon: DeepReadonly<IPolygon>,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean => {
      if (polygon.vertices.length <= 0) return false;
      if (
        Geometry.CollideExplicit.CirclePoint(
          cx,
          cy,
          cr,
          polygon.vertices[0].x + xOffsetPolygon,
          polygon.vertices[0].y + yOffsetPolygon
        )
      )
        return true;
      if (Geometry.CollideExplicit.PolygonPoint(polygon, cx, cy, xOffsetPolygon, yOffsetPolygon)) return true;

      for (let i = 0; i < polygon.vertices.length; i++) {
        const a = polygon.vertices[i];
        const b = polygon.vertices[(i + 1) % polygon.vertices.length];
        if (
          Geometry.CollideExplicit.CircleSegment(
            cx,
            cy,
            cr,
            a.x + xOffsetPolygon,
            a.y + yOffsetPolygon,
            b.x + xOffsetPolygon,
            b.y + yOffsetPolygon
          )
        )
          return true;
      }

      return false;
    },
    CirclePath: (
      cx: number,
      cy: number,
      cr: number,
      path: DeepReadonly<IPath>,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.CircleSegment(
            cx,
            cy,
            cr,
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath
          )
        )
          return true;
      }
      return false;
    },
    CircleSegment: (cx: number, cy: number, cr: number, ax: number, ay: number, bx: number, by: number): boolean => {
      const abx = bx - ax;
      const aby = by - ay;
      const acx = cx - ax;
      const acy = cy - ay;
      const lenSq = Math.max(Geometry.DistanceSq(abx, aby), Geometry.Tolerance);
      const dot = Geometry.Dot(acx, acy, abx, aby);
      const projx = (abx * dot) / lenSq;
      const projy = (aby * dot) / lenSq;
      const retx = projx + ax;
      const rety = projy + ay;
      const r = Geometry.Dot(retx - ax, rety - ay, abx, aby);
      let px: number, py: number;
      if (r < 0) {
        px = ax;
        py = ay;
      } else if (r > Geometry.DistanceSq(abx, aby)) {
        px = bx;
        py = by;
      } else {
        px = retx;
        py = rety;
      }
      return Geometry.CollideExplicit.CirclePoint(cx, cy, cr, px, py);
    },
    CircleRay: (cx: number, cy: number, cr: number, ax: number, ay: number, bx: number, by: number): boolean =>
      Geometry.CollideExplicit.CirclePoint(
        cx,
        cy,
        cr,
        Geometry.Ray.Explicit.ClosestPointXTo(ax, ay, bx, by, cx, cy),
        Geometry.Ray.Explicit.ClosestPointYTo(ax, ay, bx, by, cx, cy)
      ),
    CircleLine: (cx: number, cy: number, cr: number, ax: number, ay: number, bx: number, by: number): boolean =>
      Geometry.CollideExplicit.CirclePoint(
        cx,
        cy,
        cr,
        Geometry.Line.Explicit.ClosestPointXTo(ax, ay, bx, by, cx, cy),
        Geometry.Line.Explicit.ClosestPointYTo(ax, ay, bx, by, cx, cy)
      ),
    CirclePoint: (cx: number, cy: number, cr: number, px: number, py: number): boolean =>
      (cx - px) * (cx - px) + (cy - py) * (cy - py) <= cr * cr,
    TriangleTriangle: (
      aax: number,
      aay: number,
      abx: number,
      aby: number,
      acx: number,
      acy: number,
      bax: number,
      bay: number,
      bbx: number,
      bby: number,
      bcx: number,
      bcy: number
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(aax, aay, abx, aby, acx, acy, bax, bay) ||
      Geometry.CollideExplicit.TrianglePoint(bax, bay, bbx, bby, bcx, bcy, aax, aay) ||
      Geometry.CollideExplicit.SegmentSegment(aax, aay, abx, aby, bax, bay, bbx, bby) ||
      Geometry.CollideExplicit.SegmentSegment(aax, aay, abx, aby, bbx, bby, bcx, bcy) ||
      Geometry.CollideExplicit.SegmentSegment(aax, aay, abx, aby, bcx, bcy, bax, bay) ||
      Geometry.CollideExplicit.SegmentSegment(abx, aby, acx, acy, bax, bay, bbx, bby) ||
      Geometry.CollideExplicit.SegmentSegment(abx, aby, acx, acy, bbx, bby, bcx, bcy) ||
      Geometry.CollideExplicit.SegmentSegment(abx, aby, acx, acy, bcx, bcy, bax, bay) ||
      Geometry.CollideExplicit.SegmentSegment(acx, acy, aax, aay, bax, bay, bbx, bby) ||
      Geometry.CollideExplicit.SegmentSegment(acx, acy, aax, aay, bbx, bby, bcx, bcy) ||
      Geometry.CollideExplicit.SegmentSegment(acx, acy, aax, aay, bcx, bcy, bax, bay),
    TrianglePolygon: (
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number,
      polygon: DeepReadonly<IPolygon>,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean =>
      polygon.vertices.length > 0 &&
      (Geometry.CollideExplicit.PolygonPoint(polygon, tax, tay, xOffsetPolygon, yOffsetPolygon) ||
        Geometry.CollideExplicit.TrianglePoint(
          tax,
          tay,
          tbx,
          tby,
          tcx,
          tcy,
          polygon.vertices[0].x + xOffsetPolygon,
          polygon.vertices[0].y + yOffsetPolygon
        ) ||
        Geometry.CollideExplicit.PolygonSegment(polygon, tax, tay, tbx, tby, xOffsetPolygon, yOffsetPolygon) ||
        Geometry.CollideExplicit.PolygonSegment(polygon, tbx, tby, tcx, tcy, xOffsetPolygon, yOffsetPolygon) ||
        Geometry.CollideExplicit.PolygonSegment(polygon, tcx, tcy, tax, tay, xOffsetPolygon, yOffsetPolygon)),
    TrianglePath: (
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number,
      path: DeepReadonly<IPath>,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.TriangleSegment(
            tax,
            tay,
            tbx,
            tby,
            tcx,
            tcy,
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath
          )
        )
          return true;
      }
      return false;
    },
    TriangleSegment: (
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number,
      sax: number,
      say: number,
      sbx: number,
      sby: number
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, sax, say) ||
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, sbx, sby) ||
      Geometry.CollideExplicit.SegmentSegment(tax, tay, tbx, tby, sax, say, sbx, sby) ||
      Geometry.CollideExplicit.SegmentSegment(tbx, tby, tcx, tcy, sax, say, sbx, sby) ||
      Geometry.CollideExplicit.SegmentSegment(tcx, tcy, tax, tay, sax, say, sbx, sby),
    TriangleRay: (
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number,
      rax: number,
      ray: number,
      rbx: number,
      rby: number
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, rax, ray) ||
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, rbx, rby) ||
      Geometry.CollideExplicit.SegmentRay(tax, tay, tbx, tby, rax, ray, rbx, rby) ||
      Geometry.CollideExplicit.SegmentRay(tbx, tby, tcx, tcy, rax, ray, rbx, rby) ||
      Geometry.CollideExplicit.SegmentRay(tcx, tcy, tax, tay, rax, ray, rbx, rby),
    TriangleLine: (
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number,
      lax: number,
      lay: number,
      lbx: number,
      lby: number
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, lax, lay) ||
      Geometry.CollideExplicit.TrianglePoint(tax, tay, tbx, tby, tcx, tcy, lbx, lby) ||
      Geometry.CollideExplicit.SegmentLine(tax, tay, tbx, tby, lax, lay, lbx, lby) ||
      Geometry.CollideExplicit.SegmentLine(tbx, tby, tcx, tcy, lax, lay, lbx, lby) ||
      Geometry.CollideExplicit.SegmentLine(tcx, tcy, tax, tay, lax, lay, lbx, lby),
    TrianglePoint: (
      tax: number,
      tay: number,
      tbx: number,
      tby: number,
      tcx: number,
      tcy: number,
      px: number,
      py: number
    ): boolean => {
      // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
      const areaSigned2xInverse = 1 / (-tby * tcx + tay * (-tbx + tcx) + tax * (tby - tcy) + tbx * tcy);
      const s = areaSigned2xInverse * (tay * tcx - tax * tcy + (tcy - tay) * px + (tax - tcx) * py);
      const t = areaSigned2xInverse * (tax * tby - tay * tbx + (tay - tby) * px + (tbx - tax) * py);
      return s > 0 && t > 0 && 1 - s - t > 0;
    },
    PolygonPolygon: (
      a: DeepReadonly<IPolygon>,
      b: DeepReadonly<IPolygon>,
      xOffsetA = 0,
      yOffsetA = 0,
      xOffsetB = 0,
      yOffsetB = 0
    ): boolean => {
      if (a.vertices.length <= 0 || b.vertices.length <= 0) return false;

      if (
        Geometry.CollideExplicit.PolygonPoint(
          a,
          b.vertices[0].x + xOffsetB,
          b.vertices[0].y + yOffsetB,
          xOffsetA,
          yOffsetA
        )
      )
        return true;

      if (
        Geometry.CollideExplicit.PolygonPoint(
          b,
          a.vertices[0].x + xOffsetA,
          a.vertices[0].y + yOffsetA,
          xOffsetB,
          yOffsetB
        )
      )
        return true;

      for (let i = 0; i < a.vertices.length; i++) {
        const aa = a.vertices[i];
        const ab = a.vertices[(i + 1) % a.vertices.length];
        if (
          Geometry.CollideExplicit.PolygonSegment(
            b,
            aa.x + xOffsetA,
            aa.y + yOffsetA,
            ab.x + xOffsetA,
            ab.y + yOffsetA,
            xOffsetB,
            yOffsetB
          )
        )
          return true;
      }

      return false;
    },
    PolygonPath: (
      polygon: DeepReadonly<IPolygon>,
      path: DeepReadonly<IPath>,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.PolygonSegment(
            polygon,
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath,
            xOffsetPolygon,
            yOffsetPolygon
          )
        )
          return true;
      }
      return false;
    },
    PolygonSegment: (
      polygon: DeepReadonly<IPolygon>,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean => {
      if (Geometry.CollideExplicit.PolygonPoint(polygon, ax, ay, xOffsetPolygon, yOffsetPolygon)) return true;

      for (let i = 0; i < polygon.vertices.length; i++) {
        const a = polygon.vertices[i];
        const b = polygon.vertices[(i + 1) % polygon.vertices.length];
        if (
          Geometry.CollideExplicit.SegmentSegment(
            a.x + xOffsetPolygon,
            a.y + yOffsetPolygon,
            b.x + xOffsetPolygon,
            b.y + yOffsetPolygon,
            ax,
            ay,
            bx,
            by
          )
        )
          return true;
      }

      return false;
    },
    PolygonRay: (
      { vertices }: DeepReadonly<IPolygon>,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean => {
      for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];
        if (
          Geometry.CollideExplicit.SegmentRay(
            a.x + xOffsetPolygon,
            a.y + yOffsetPolygon,
            b.x + xOffsetPolygon,
            b.y + yOffsetPolygon,
            ax,
            ay,
            bx,
            by
          )
        )
          return true;
      }

      return false;
    },
    PolygonLine: (
      { vertices }: DeepReadonly<IPolygon>,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean => {
      for (let i = 0; i < vertices.length; i++) {
        const a = vertices[i];
        const b = vertices[(i + 1) % vertices.length];
        if (
          Geometry.CollideExplicit.SegmentLine(
            a.x + xOffsetPolygon,
            a.y + yOffsetPolygon,
            b.x + xOffsetPolygon,
            b.y + yOffsetPolygon,
            ax,
            ay,
            bx,
            by
          )
        )
          return true;
      }

      return false;
    },
    PolygonPoint: (
      polygon: DeepReadonly<IPolygon>,
      px: number,
      py: number,
      xOffsetPolygon = 0,
      yOffsetPolygon = 0
    ): boolean => Geometry.Polygon.Explicit.WindingNumber(polygon, px - xOffsetPolygon, py - yOffsetPolygon) != 0,
    PathPath: (
      a: DeepReadonly<IPath>,
      b: DeepReadonly<IPath>,
      axOffset = 0,
      ayOffset = 0,
      bxOffset = 0,
      byOffset = 0
    ): boolean => {
      for (let i = 1; i < b.length; i++) {
        const ba = b[i - 1];
        const bb = b[i];
        if (
          Geometry.CollideExplicit.PathSegment(
            a,
            ba.x + bxOffset,
            ba.y + byOffset,
            bb.x + bxOffset,
            bb.y + byOffset,
            axOffset,
            ayOffset
          )
        )
          return true;
      }
      return false;
    },
    PathSegment: (
      path: DeepReadonly<IPath>,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.SegmentSegment(
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath,
            ax,
            ay,
            bx,
            by
          )
        )
          return true;
      }
      return false;
    },
    PathRay: (
      path: DeepReadonly<IPath>,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.SegmentRay(
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath,
            ax,
            ay,
            bx,
            by
          )
        )
          return true;
      }
      return false;
    },
    PathLine: (
      path: DeepReadonly<IPath>,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      xOffsetPath = 0,
      yOffsetPath = 0
    ): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.SegmentLine(
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath,
            ax,
            ay,
            bx,
            by
          )
        )
          return true;
      }
      return false;
    },
    PathPoint: (path: DeepReadonly<IPath>, px: number, py: number, xOffsetPath = 0, yOffsetPath = 0): boolean => {
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1];
        const b = path[i];
        if (
          Geometry.CollideExplicit.SegmentPoint(
            a.x + xOffsetPath,
            a.y + yOffsetPath,
            b.x + xOffsetPath,
            b.y + yOffsetPath,
            px,
            py
          )
        )
          return true;
      }
      return false;
    },
    SegmentSegment: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): boolean => Geometry.IntersectionExplicit.SegmentSegment(Aax, Aay, Abx, Aby, Bax, Bay, Bbx, Bby) != null,
    SegmentRay: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): boolean => Geometry.IntersectionExplicit.SegmentRay(Aax, Aay, Abx, Aby, Bax, Bay, Bbx, Bby) != null,
    SegmentLine: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): boolean => Geometry.IntersectionExplicit.SegmentLine(Aax, Aay, Abx, Aby, Bax, Bay, Bbx, Bby) != null,
    SegmentPoint: (ax: number, ay: number, bx: number, by: number, px: number, py: number): boolean =>
      Geometry.IsColinearWith(px, py, ax, ay, bx, by) && Geometry.InsideSegmentIfColinear(px, py, ax, ay, bx, by),
    RayRay: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): boolean => Geometry.IntersectionExplicit.RayRay(Aax, Aay, Abx, Aby, Bax, Bay, Bbx, Bby) != null,
    RayLine: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): boolean => Geometry.IntersectionExplicit.RayLine(Aax, Aay, Abx, Aby, Bax, Bay, Bbx, Bby) != null,
    RayPoint: (ax: number, ay: number, bx: number, by: number, px: number, py: number): boolean =>
      Geometry.IsColinearWith(px, py, ax, ay, bx, by) && Geometry.InsideRayIfColinear(px, py, ax, ay, bx, by),
    LineLine: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): boolean => Geometry.IntersectionExplicit.LineLine(Aax, Aay, Abx, Aby, Bax, Bay, Bbx, Bby) != null,
    LinePoint: (ax: number, ay: number, bx: number, by: number, px: number, py: number): boolean =>
      Geometry.IsColinearWith(px, py, ax, ay, bx, by),
    PointPoint: (ax: number, ay: number, bx: number, by: number): boolean =>
      Geometry.IsWithinToleranceOf(ax, bx) && Geometry.IsWithinToleranceOf(ay, by),
  };

  // TODO:
  //  1. test all collisions (most ray/segment/line vs shape collisions are untested)
  //  2. create matching functions in Geometry.Intersection that actually returns intersection points, if any
  public static Collide = {
    RectangleRectangle: (
      rectangleA: DeepReadonly<IRectangle>,
      rectangleB: DeepReadonly<IRectangle>,
      rectangleAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      rectangleBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectangleRectangle(
        rectangleA.x + rectangleAOffset.x,
        rectangleA.y + rectangleAOffset.y,
        rectangleA.w,
        rectangleA.h,
        rectangleB.x + rectangleBOffset.x,
        rectangleB.y + rectangleBOffset.y,
        rectangleB.w,
        rectangleB.h
      ),
    RectangleCircle: (
      rectangle: DeepReadonly<IRectangle>,
      circle: DeepReadonly<ICircle>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      rectangleAngle: number = 0
    ): boolean =>
      Geometry.CollideExplicit.RectangleCircle(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        circle.x + circleOffset.x,
        circle.y + circleOffset.y,
        circle.r,
        rectangleAngle
      ),
    RectangleTriangle: (
      rectangle: DeepReadonly<IRectangle>,
      triangle: DeepReadonly<ITriangle>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      triangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectangleTriangle(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        triangle.a.x + triangleOffset.x,
        triangle.a.y + triangleOffset.y,
        triangle.b.x + triangleOffset.x,
        triangle.b.y + triangleOffset.y,
        triangle.c.x + triangleOffset.x,
        triangle.c.y + triangleOffset.y
      ),
    RectanglePolygon: (
      rectangle: DeepReadonly<IRectangle>,
      polygon: DeepReadonly<IPolygon>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      polygonOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectanglePolygon(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        polygon,
        polygonOffset.x,
        polygonOffset.y
      ),
    RectanglePath: (
      rectangle: DeepReadonly<IRectangle>,
      path: DeepReadonly<IPath>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pathOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectanglePath(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        path,
        pathOffset.x,
        pathOffset.y
      ),
    RectangleSegment: (
      rectangle: DeepReadonly<IRectangle>,
      segment: DeepReadonly<ISegment>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      segmentOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectangleSegment(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        segment.a.x + segmentOffset.x,
        segment.a.y + segmentOffset.y,
        segment.b.x + segmentOffset.x,
        segment.b.y + segmentOffset.y
      ),
    RectangleLine: (
      rectangle: DeepReadonly<IRectangle>,
      line: DeepReadonly<ILine>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      lineOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectangleLine(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        line.a.x + lineOffset.x,
        line.a.y + lineOffset.y,
        line.b.x + lineOffset.x,
        line.b.y + lineOffset.y
      ),
    RectangleRay: (
      rectangle: DeepReadonly<IRectangle>,
      ray: DeepReadonly<IRay>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      rayOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectangleRay(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        ray.a.x + rayOffset.x,
        ray.a.y + rayOffset.y,
        ray.b.x + rayOffset.x,
        ray.b.y + rayOffset.y
      ),
    RectanglePoint: (
      rectangle: DeepReadonly<IRectangle>,
      point: DeepReadonly<IPoint>,
      rectangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pointOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RectanglePoint(
        rectangle.x + rectangleOffset.x,
        rectangle.y + rectangleOffset.y,
        rectangle.w,
        rectangle.h,
        point.x + pointOffset.x,
        point.y + pointOffset.y
      ),
    CircleCircle: (
      circleA: DeepReadonly<ICircle>,
      circleB: DeepReadonly<ICircle>,
      circleAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      circleBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CircleCircle(
        circleA.x + circleAOffset.x,
        circleA.y + circleAOffset.y,
        circleA.r,
        circleB.x + circleBOffset.x,
        circleB.y + circleBOffset.y,
        circleB.r
      ),
    CircleTriangle: (
      circle: DeepReadonly<ICircle>,
      triangle: DeepReadonly<ITriangle>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      triangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CircleTriangle(
        circle.x + circleOffset.x,
        circle.y + circleOffset.y,
        circle.r,
        triangle.a.x + triangleOffset.x,
        triangle.a.y + triangleOffset.y,
        triangle.b.x + triangleOffset.x,
        triangle.b.y + triangleOffset.y,
        triangle.c.x + triangleOffset.x,
        triangle.c.y + triangleOffset.y
      ),
    CirclePolygon: (
      circle: DeepReadonly<ICircle>,
      polygon: DeepReadonly<IPolygon>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      polygonOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CirclePolygon(
        circle.x + circleOffset.x,
        circle.y + circleOffset.y,
        circle.r,
        polygon,
        polygonOffset.x,
        polygonOffset.y
      ),
    CirclePath: (
      a: DeepReadonly<ICircle>,
      b: DeepReadonly<IPath>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean => Geometry.CollideExplicit.CirclePath(a.x + aOffset.x, a.y + aOffset.y, a.r, b, bOffset.x, bOffset.y),
    CircleSegment: (
      a: DeepReadonly<ICircle>,
      b: DeepReadonly<ISegment>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CircleSegment(
        a.x + aOffset.x,
        a.y + aOffset.y,
        a.r,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    CircleRay: (
      a: DeepReadonly<ICircle>,
      b: DeepReadonly<IRay>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CircleRay(
        a.x + aOffset.x,
        a.y + aOffset.y,
        a.r,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    CircleLine: (
      a: DeepReadonly<ICircle>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CircleLine(
        a.x + aOffset.x,
        a.y + aOffset.y,
        a.r,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    CirclePoint: (
      circle: DeepReadonly<ICircle>,
      point: DeepReadonly<IPoint>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pointOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.CirclePoint(
        circle.x + circleOffset.x,
        circle.y + circleOffset.y,
        circle.r,
        point.x + pointOffset.x,
        point.y + pointOffset.y
      ),
    TriangleTriangle: (
      a: DeepReadonly<ITriangle>,
      b: DeepReadonly<ITriangle>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TriangleTriangle(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        a.c.x + aOffset.x,
        a.c.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        b.c.x + bOffset.x,
        b.c.y + bOffset.y
      ),
    TrianglePolygon: (
      triangle: DeepReadonly<ITriangle>,
      polygon: DeepReadonly<IPolygon>,
      triangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      polygonOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TrianglePolygon(
        triangle.a.x + triangleOffset.x,
        triangle.a.y + triangleOffset.y,
        triangle.b.x + triangleOffset.x,
        triangle.b.y + triangleOffset.y,
        triangle.c.x + triangleOffset.x,
        triangle.c.y + triangleOffset.y,
        polygon,
        polygonOffset.x,
        polygonOffset.y
      ),
    TrianglePath: (
      a: DeepReadonly<ITriangle>,
      b: DeepReadonly<IPath>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TrianglePath(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        a.c.x + aOffset.x,
        a.c.y + aOffset.y,
        b,
        bOffset.x,
        bOffset.y
      ),
    TriangleSegment: (
      a: DeepReadonly<ITriangle>,
      b: DeepReadonly<ISegment>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TriangleSegment(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        a.c.x + aOffset.x,
        a.c.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    TriangleRay: (
      a: DeepReadonly<ITriangle>,
      b: DeepReadonly<IRay>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TriangleRay(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        a.c.x + aOffset.x,
        a.c.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    TriangleLine: (
      a: DeepReadonly<ITriangle>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TriangleLine(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        a.c.x + aOffset.x,
        a.c.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    TrianglePoint: (
      triangle: DeepReadonly<ITriangle>,
      point: DeepReadonly<IPoint>,
      triangleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pointOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.TrianglePoint(
        triangle.a.x + triangleOffset.x,
        triangle.a.y + triangleOffset.y,
        triangle.b.x + triangleOffset.x,
        triangle.b.y + triangleOffset.y,
        triangle.c.x + triangleOffset.x,
        triangle.c.y + triangleOffset.y,
        point.x + pointOffset.x,
        point.y + pointOffset.y
      ),
    PolygonPolygon: (
      polygonA: DeepReadonly<IPolygon>,
      polygonB: DeepReadonly<IPolygon>,
      polygonAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      polygonBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PolygonPolygon(
        polygonA,
        polygonB,
        polygonAOffset.x,
        polygonAOffset.y,
        polygonBOffset.x,
        polygonBOffset.y
      ),
    PolygonPath: (
      polygon: DeepReadonly<IPolygon>,
      path: DeepReadonly<IPath>,
      polygonOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pathOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PolygonPath(polygon, path, polygonOffset.x, polygonOffset.y, pathOffset.x, pathOffset.y),
    PolygonSegment: (
      a: DeepReadonly<IPolygon>,
      b: DeepReadonly<ISegment>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PolygonSegment(
        a,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        aOffset.x,
        aOffset.y
      ),
    PolygonRay: (
      a: DeepReadonly<IPolygon>,
      b: DeepReadonly<IRay>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PolygonRay(
        a,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        aOffset.x,
        aOffset.y
      ),
    PolygonLine: (
      a: DeepReadonly<IPolygon>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PolygonLine(
        a,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        aOffset.x,
        aOffset.y
      ),
    PolygonPoint: (
      polygon: DeepReadonly<IPolygon>,
      point: DeepReadonly<IPoint>,
      polygonOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pointOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PolygonPoint(
        polygon,
        point.x + pointOffset.x,
        point.y + pointOffset.y,
        polygonOffset.x,
        polygonOffset.y
      ),
    PathPath: (
      a: DeepReadonly<IPath>,
      b: DeepReadonly<IPath>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean => Geometry.CollideExplicit.PathPath(a, b, aOffset.x, aOffset.y, bOffset.x, bOffset.y),
    PathSegment: (
      a: DeepReadonly<IPath>,
      b: DeepReadonly<ISegment>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PathSegment(
        a,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        aOffset.x,
        aOffset.y
      ),
    PathRay: (
      a: DeepReadonly<IPath>,
      b: DeepReadonly<IRay>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PathRay(
        a,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        aOffset.x,
        aOffset.y
      ),
    PathLine: (
      a: DeepReadonly<IPath>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PathLine(
        a,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y,
        aOffset.x,
        aOffset.y
      ),
    PathPoint: (
      a: DeepReadonly<IPath>,
      b: DeepReadonly<IPoint>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean => Geometry.CollideExplicit.PathPoint(a, b.x + bOffset.x, b.y + bOffset.y, aOffset.x, aOffset.y),
    SegmentSegment: (
      a: DeepReadonly<ISegment>,
      b: DeepReadonly<ISegment>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.SegmentSegment(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    SegmentRay: (
      a: DeepReadonly<ISegment>,
      b: DeepReadonly<IRay>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.SegmentRay(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    SegmentLine: (
      a: DeepReadonly<ISegment>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.SegmentLine(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    SegmentPoint: (
      a: DeepReadonly<ISegment>,
      b: DeepReadonly<IPoint>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.SegmentPoint(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.x + bOffset.x,
        b.y + bOffset.y
      ),
    RayRay: (
      a: DeepReadonly<IRay>,
      b: DeepReadonly<IRay>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RayRay(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    RayLine: (
      a: DeepReadonly<IRay>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RayLine(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    RayPoint: (
      a: DeepReadonly<IRay>,
      b: DeepReadonly<IPoint>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.RayPoint(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.x + bOffset.x,
        b.y + bOffset.y
      ),
    LineLine: (
      a: DeepReadonly<ILine>,
      b: DeepReadonly<ILine>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.LineLine(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.a.x + bOffset.x,
        b.a.y + bOffset.y,
        b.b.x + bOffset.x,
        b.b.y + bOffset.y
      ),
    LinePoint: (
      a: DeepReadonly<ILine>,
      b: DeepReadonly<IPoint>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.LinePoint(
        a.a.x + aOffset.x,
        a.a.y + aOffset.y,
        a.b.x + aOffset.x,
        a.b.y + aOffset.y,
        b.x + bOffset.x,
        b.y + bOffset.y
      ),
    PointPoint: (
      a: DeepReadonly<IPoint>,
      b: DeepReadonly<IPoint>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean =>
      Geometry.CollideExplicit.PointPoint(a.x + aOffset.x, a.y + aOffset.y, b.x + bOffset.x, b.y + bOffset.y),
    SegmentsSegments: (
      segmentsA: DeepReadonly<DeepReadonly<ISegment>[]>,
      segmentsB: DeepReadonly<DeepReadonly<ISegment>[]>
    ): boolean =>
      segmentsA.any(segmentA => segmentsB.any(segmentB => Geometry.Collide.SegmentSegment(segmentA, segmentB))),
    AnyAny: (
      a?: DeepReadonly<Shape>,
      b?: DeepReadonly<Shape>,
      aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): boolean => {
      if (a == null || b == null) return false;

      if (IsRectangle(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectangleRectangle(a, b, aOffset, bOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.RectangleCircle(a, b, aOffset, bOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.RectangleTriangle(a, b, aOffset, bOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.RectanglePolygon(a, b, aOffset, bOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.RectanglePath(a, b, aOffset, bOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.RectangleSegment(a, b, aOffset, bOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.RectangleRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.RectangleLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.RectanglePoint(a, b, aOffset, bOffset);
        }
        throw `(Rectangle) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsCircle(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectangleCircle(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CircleCircle(a, b, aOffset, bOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.CircleTriangle(a, b, aOffset, bOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.CirclePolygon(a, b, aOffset, bOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.CirclePath(a, b, aOffset, bOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.CircleSegment(a, b, aOffset, bOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.CircleRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.CircleLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.CirclePoint(a, b, aOffset, bOffset);
        }
        throw `(Circle) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsTriangle(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectangleTriangle(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CircleTriangle(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TriangleTriangle(a, b, aOffset, bOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.TrianglePolygon(a, b, aOffset, bOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.TrianglePath(a, b, aOffset, bOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.TriangleSegment(a, b, aOffset, bOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.TriangleRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.TriangleLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.TrianglePoint(a, b, aOffset, bOffset);
        }
        throw `(Triangle) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsPolygon(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectanglePolygon(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CirclePolygon(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TrianglePolygon(b, a, bOffset, aOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.PolygonPolygon(a, b, aOffset, bOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.PolygonPath(a, b, aOffset, bOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.PolygonSegment(a, b, aOffset, bOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.PolygonRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.PolygonLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.PolygonPoint(a, b, aOffset, bOffset);
        }
        throw `(Polygon) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsPath(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectanglePath(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CirclePath(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TrianglePath(b, a, bOffset, aOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.PolygonPath(b, a, bOffset, aOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.PathPath(a, b, aOffset, bOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.PathSegment(a, b, aOffset, bOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.PathRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.PathLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.PathPoint(a, b, aOffset, bOffset);
        }
        throw `(Path) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsSegment(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectangleSegment(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CircleSegment(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TriangleSegment(b, a, bOffset, aOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.PolygonSegment(b, a, bOffset, aOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.PathSegment(b, a, bOffset, aOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.SegmentSegment(a, b, aOffset, bOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.SegmentRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.SegmentLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.SegmentPoint(a, b, aOffset, bOffset);
        }
        throw `(Segment) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsRay(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectangleRay(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CircleRay(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TriangleRay(b, a, bOffset, aOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.PolygonRay(b, a, bOffset, aOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.PathRay(b, a, bOffset, aOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.SegmentRay(b, a, bOffset, aOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.RayRay(a, b, aOffset, bOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.RayLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.RayPoint(a, b, aOffset, bOffset);
        }
        throw `(Ray) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsLine(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectangleLine(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CircleLine(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TriangleLine(b, a, bOffset, aOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.PolygonLine(b, a, bOffset, aOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.PathLine(b, a, bOffset, aOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.SegmentLine(b, a, bOffset, aOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.RayLine(b, a, bOffset, aOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.LineLine(a, b, aOffset, bOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.LinePoint(a, b, aOffset, bOffset);
        }
        throw `(Line) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      if (IsPoint(a)) {
        if (IsRectangle(b)) {
          return Geometry.Collide.RectanglePoint(b, a, bOffset, aOffset);
        } else if (IsCircle(b)) {
          return Geometry.Collide.CirclePoint(b, a, bOffset, aOffset);
        } else if (IsTriangle(b)) {
          return Geometry.Collide.TrianglePoint(b, a, bOffset, aOffset);
        } else if (IsPolygon(b)) {
          return Geometry.Collide.PolygonPoint(b, a, bOffset, aOffset);
        } else if (IsPath(b)) {
          return Geometry.Collide.PathPoint(b, a, bOffset, aOffset);
        } else if (IsSegment(b)) {
          return Geometry.Collide.SegmentPoint(b, a, bOffset, aOffset);
        } else if (IsRay(b)) {
          return Geometry.Collide.RayPoint(b, a, bOffset, aOffset);
        } else if (IsLine(b)) {
          return Geometry.Collide.LinePoint(b, a, bOffset, aOffset);
        } else if (IsPoint(b)) {
          return Geometry.Collide.PointPoint(a, b, aOffset, bOffset);
        }
        throw `(Point) Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
      }

      throw `Unfamiliar colliding shape a = ${JSON.stringify(a)}`;
    },
  };

  // given 3 colinear points, returns true if "b" and "c" are on the same side of "a"
  // returns true when "b" or "c" is equal to "a"
  // i.e. used to check if a point has exceeded the endpoint of a PointPair
  //  a = endpoint of PointPair being checked
  //  b = other endpoint of the same PointPair
  //  c = point being checked against the PointPair)
  // TODO: rename
  private static isSameSideOfPointExplicit = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number
  ) => {
    return Geometry.IsWithinToleranceOf(ax, bx)
      ? Math.sign(cy - ay) === Math.sign(by - ay) ||
          Geometry.IsWithinToleranceOf(ay, cy) ||
          Geometry.IsWithinToleranceOf(ay, by)
      : Math.sign(cx - ax) === Math.sign(bx - ax) ||
          Geometry.IsWithinToleranceOf(ax, cx) ||
          Geometry.IsWithinToleranceOf(ax, bx);
  };
  private static isSameSideOfPoint = (
    a: DeepReadonly<IPoint>,
    b: DeepReadonly<IPoint>,
    c: DeepReadonly<IPoint>,
    aOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
    bOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
    cOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
  ) => {
    const ax = a.x + aOffset.x;
    const ay = a.y + aOffset.y;
    const bx = b.x + bOffset.x;
    const by = b.y + bOffset.y;
    const cx = c.x + cOffset.x;
    const cy = c.y + cOffset.y;
    return Geometry.isSameSideOfPointExplicit(ax, ay, bx, by, cx, cy);
  };

  public static IntersectionExplicit = {
    CircleCircle: (
      ax: number,
      ay: number,
      ar: number,
      bx: number,
      by: number,
      br: number
    ): [IPoint, IPoint] | [IPoint] | [] => {
      const angle = Geometry.Angle(bx - ax, by - ay);
      const d2 = Geometry.DistanceSq(ax, ay, bx, by);

      // the circles are on top of one another, so either they have infinite points touching (circles are the same) or they have none (they aren't the same)
      // either way, no possible return value
      if (d2 <= 0) return [];

      const d = Math.sqrt(d2);

      // the circle are too far apart to intersect
      if (d > ar + br) return [];

      const a = (ar * ar - br * br + d2) / (2 * d);
      const h2 = ar * ar - a * a;

      // one circle is inside the other
      if (h2 < 0) return [];

      const h = Math.sqrt(h2);
      const xm = ax + a * Math.cos(angle);
      const ym = ay + a * Math.sin(angle);

      // circles are tangentially touching each other
      if (h <= 0) return [{ x: xm, y: ym }];

      const xh = (h * (by - ay)) / d;
      const yh = (h * (bx - ax)) / d;

      // circles have two intersection points
      return [
        {
          x: xm + xh,
          y: ym - yh,
        },
        {
          x: xm - xh,
          y: ym + yh,
        },
      ];
    },

    RectanglePointPair: (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      pairType: PointPairType
    ): IPoint[] => {
      const xCorner1 = rx;
      const yCorner1 = ry;
      const xCorner2 = rx + rw;
      const yCorner2 = ry;
      const xCorner3 = rx + rw;
      const yCorner3 = ry + rh;
      const xCorner4 = rx;
      const yCorner4 = ry + rh;

      const intersection1 = Geometry.IntersectionExplicit.PointPairPointPair(
        ax,
        ay,
        bx,
        by,
        pairType,
        xCorner1,
        yCorner1,
        xCorner2,
        yCorner2,
        PointPairType.SEGMENT
      );
      const intersection2 = Geometry.IntersectionExplicit.PointPairPointPair(
        ax,
        ay,
        bx,
        by,
        pairType,
        xCorner2,
        yCorner2,
        xCorner3,
        yCorner3,
        PointPairType.SEGMENT
      );
      const intersection3 = Geometry.IntersectionExplicit.PointPairPointPair(
        ax,
        ay,
        bx,
        by,
        pairType,
        xCorner3,
        yCorner3,
        xCorner4,
        yCorner4,
        PointPairType.SEGMENT
      );
      const intersection4 = Geometry.IntersectionExplicit.PointPairPointPair(
        ax,
        ay,
        bx,
        by,
        pairType,
        xCorner4,
        yCorner4,
        xCorner1,
        yCorner1,
        PointPairType.SEGMENT
      );

      const intersections: IPoint[] = [];
      if (intersection1 != null) intersections.push(intersection1);

      if (intersection2 != null && !Geometry.Point.AreEqual(intersection1, intersection2))
        intersections.push(intersection2);

      if (
        intersection3 != null &&
        !Geometry.Point.AreEqual(intersection1, intersection3) &&
        !Geometry.Point.AreEqual(intersection2, intersection3)
      )
        intersections.push(intersection3);

      if (
        intersection4 != null &&
        !Geometry.Point.AreEqual(intersection1, intersection4) &&
        !Geometry.Point.AreEqual(intersection2, intersection4) &&
        !Geometry.Point.AreEqual(intersection3, intersection4)
      )
        intersections.push(intersection4);
      return intersections;
    },

    SegmentSegment: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        Aax,
        Aay,
        Abx,
        Aby,
        PointPairType.SEGMENT,
        Bax,
        Bay,
        Bbx,
        Bby,
        PointPairType.SEGMENT
      ),
    SegmentRay: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        Aax,
        Aay,
        Abx,
        Aby,
        PointPairType.SEGMENT,
        Bax,
        Bay,
        Bbx,
        Bby,
        PointPairType.RAY
      ),
    SegmentLine: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        Aax,
        Aay,
        Abx,
        Aby,
        PointPairType.SEGMENT,
        Bax,
        Bay,
        Bbx,
        Bby,
        PointPairType.LINE
      ),
    RayRay: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        Aax,
        Aay,
        Abx,
        Aby,
        PointPairType.RAY,
        Bax,
        Bay,
        Bbx,
        Bby,
        PointPairType.RAY
      ),
    RayLine: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        Aax,
        Aay,
        Abx,
        Aby,
        PointPairType.RAY,
        Bax,
        Bay,
        Bbx,
        Bby,
        PointPairType.LINE
      ),
    LineLine: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        Aax,
        Aay,
        Abx,
        Aby,
        PointPairType.LINE,
        Bax,
        Bay,
        Bbx,
        Bby,
        PointPairType.LINE
      ),

    PointPairPointPair: (
      Aax: number,
      Aay: number,
      Abx: number,
      Aby: number,
      Atype: PointPairType,
      Bax: number,
      Bay: number,
      Bbx: number,
      Bby: number,
      Btype: PointPairType
    ): IPoint | null => {
      const yFirstLineDiff = Aby - Aay;
      const xFirstLineDiff = Aax - Abx;
      const cFirst = Abx * Aay - Aax * Aby;
      const ySecondLineDiff = Bby - Bay;
      const xSecondLineDiff = Bax - Bbx;
      const cSecond = Bbx * Bay - Bax * Bby;

      const denominator = yFirstLineDiff * xSecondLineDiff - ySecondLineDiff * xFirstLineDiff;
      if (denominator === 0) return null;
      const intersection = {
        x: (xFirstLineDiff * cSecond - xSecondLineDiff * cFirst) / denominator,
        y: (ySecondLineDiff * cFirst - yFirstLineDiff * cSecond) / denominator,
      };

      if (Atype === PointPairType.LINE && Btype === PointPairType.LINE) return intersection;

      const beyondFirstA = !Geometry.isSameSideOfPointExplicit(Aax, Aay, Abx, Aby, intersection.x, intersection.y);
      const beyondFirstB = !Geometry.isSameSideOfPointExplicit(Abx, Aby, Aax, Aay, intersection.x, intersection.y);
      const beyondSecondA = !Geometry.isSameSideOfPointExplicit(Bax, Bay, Bbx, Bby, intersection.x, intersection.y);
      const beyondSecondB = !Geometry.isSameSideOfPointExplicit(Bbx, Bby, Bax, Bay, intersection.x, intersection.y);

      return (Atype === PointPairType.SEGMENT && (beyondFirstA || beyondFirstB)) ||
        (Atype === PointPairType.RAY && beyondFirstA) ||
        (Btype === PointPairType.SEGMENT && (beyondSecondA || beyondSecondB)) ||
        (Btype === PointPairType.RAY && beyondSecondA)
        ? null
        : intersection;
    },
  };

  // TODO:
  //  1. test what happens when the lines/rays/segments are directly atop one another
  //  2. add shape vs. shape intersections as well
  public static Intersection = {
    CirclePointPair: (
      circle: DeepReadonly<ICircle>,
      pair: DeepReadonly<IPointPair>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      pairOffset?: DeepReadonly<IPoint>
    ): [IPoint, IPoint] | [IPoint] | [] => {
      if (pairOffset)
        pair = {
          a: {
            x: pair.a.x + pairOffset.x,
            y: pair.a.y + pairOffset.y,
          },
          b: {
            x: pair.b.x + pairOffset.x,
            y: pair.b.y + pairOffset.y,
          },
        };
      const cx = circle.x + circleOffset.x;
      const cy = circle.y + circleOffset.y;
      const b = Geometry.Line.Yintercept(pair);
      const m = Geometry.Line.Slope(pair);
      const t = 1 + m * m;
      const u = 2 * b * m - 2 * cy * m - 2 * cx;
      const v = cx * cx + b * b + cy * cy - circle.r * circle.r - 2 * b * cy;

      const sq = u * u - 4 * t * v;
      if (sq < 0) return [];

      if (sq == 0) {
        const x = -u / (2 * t);
        const y = m * x + b;
        return [{ x, y }];
      }

      const sqrt = Math.sqrt(sq);
      const x1 = (-u + sqrt) / (2 * t);
      const y1 = m * x1 + b;
      const x2 = (-u - sqrt) / (2 * t);
      const y2 = m * x2 + b;
      return [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ];
    },
    CircleLine: (
      circle: DeepReadonly<ICircle>,
      line: DeepReadonly<ILine>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      lineOffset?: DeepReadonly<IPoint>
    ): IPoint[] => Geometry.Intersection.CirclePointPair(circle, line, circleOffset, lineOffset),
    CircleRay: (
      circle: DeepReadonly<ICircle>,
      ray: DeepReadonly<IRay>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      rayOffset?: DeepReadonly<IPoint>
    ): IPoint[] =>
      Geometry.Intersection.CirclePointPair(circle, ray, circleOffset, rayOffset).filter(o =>
        Geometry.isSameSideOfPoint(
          ray.a,
          ray.b,
          o,
          rayOffset ?? Geometry.Point.Zero,
          rayOffset ?? Geometry.Point.Zero,
          circleOffset
        )
      ),
    CircleSegment: (
      circle: DeepReadonly<ICircle>,
      segment: DeepReadonly<ISegment>,
      circleOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      segmentOffset?: DeepReadonly<IPoint>
    ): IPoint[] =>
      Geometry.Intersection.CirclePointPair(circle, segment, circleOffset, segmentOffset).filter(
        o =>
          Geometry.isSameSideOfPoint(
            segment.a,
            segment.b,
            o,
            segmentOffset ?? Geometry.Point.Zero,
            segmentOffset ?? Geometry.Point.Zero,
            circleOffset
          ) &&
          Geometry.isSameSideOfPoint(
            segment.b,
            segment.a,
            o,
            segmentOffset ?? Geometry.Point.Zero,
            segmentOffset ?? Geometry.Point.Zero,
            circleOffset
          )
      ),
    CircleCircle: (
      circleA: DeepReadonly<ICircle>,
      circleB: DeepReadonly<ICircle>,
      circleAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      circleBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): [IPoint, IPoint] | [IPoint] | [] =>
      Geometry.IntersectionExplicit.CircleCircle(
        circleA.x + circleAOffset?.x ?? 0,
        circleA.y + circleAOffset?.y ?? 0,
        circleA.r,
        circleB.x + circleBOffset?.x ?? 0,
        circleB.y + circleBOffset?.y ?? 0,
        circleB.r
      ),
    LineLine: (
      lineA: DeepReadonly<ILine>,
      lineB: DeepReadonly<ILine>,
      lineAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      lineBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.Intersection.PointPairPointPair(
        lineA,
        PointPairType.LINE,
        lineB,
        PointPairType.LINE,
        lineAOffset,
        lineBOffset
      ),
    LineRay: (
      line: DeepReadonly<ILine>,
      ray: DeepReadonly<IRay>,
      lineOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      rayOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.Intersection.PointPairPointPair(line, PointPairType.LINE, ray, PointPairType.RAY, lineOffset, rayOffset),
    LineSegment: (
      line: DeepReadonly<ILine>,
      segment: DeepReadonly<ISegment>,
      lineOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      segmentOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.Intersection.PointPairPointPair(
        line,
        PointPairType.LINE,
        segment,
        PointPairType.SEGMENT,
        lineOffset,
        segmentOffset
      ),
    RayRay: (
      rayA: DeepReadonly<IRay>,
      rayB: DeepReadonly<IRay>,
      rayAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      rayBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.Intersection.PointPairPointPair(
        rayA,
        PointPairType.RAY,
        rayB,
        PointPairType.RAY,
        rayAOffset,
        rayBOffset
      ),
    RaySegment: (
      ray: DeepReadonly<IRay>,
      segment: DeepReadonly<ISegment>,
      rayOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      segmentOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.Intersection.PointPairPointPair(
        ray,
        PointPairType.RAY,
        segment,
        PointPairType.SEGMENT,
        rayOffset,
        segmentOffset
      ),
    SegmentSegment: (
      segmentA: DeepReadonly<ISegment>,
      segmentB: DeepReadonly<ISegment>,
      segmentAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      segmentBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.IntersectionExplicit.SegmentSegment(
        segmentA.a.x + segmentAOffset.x,
        segmentA.a.y + segmentAOffset.y,
        segmentA.b.x + segmentAOffset.x,
        segmentA.b.y + segmentAOffset.y,
        segmentB.a.x + segmentBOffset.x,
        segmentB.a.y + segmentBOffset.y,
        segmentB.b.x + segmentBOffset.x,
        segmentB.b.y + segmentBOffset.y
      ),
    SegmentsSegments: (
      segmentsA: DeepReadonly<DeepReadonly<ISegment>[]>,
      segmentsB: DeepReadonly<DeepReadonly<ISegment>[]>,
      segmentsAOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      segmentsBOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint[] =>
      segmentsA
        .map(segmentA =>
          segmentsB
            .map(segmentB => Geometry.Intersection.SegmentSegment(segmentA, segmentB, segmentsAOffset, segmentsBOffset))
            .filter(o => o != null)
        )
        .flattened() as IPoint[],
    PolygonPolygon: (
      polygonA: DeepReadonly<IPolygon>,
      polygonB: DeepReadonly<IPolygon>,
      polygonAOffset?: DeepReadonly<IPoint>,
      polygonBOffset?: DeepReadonly<IPoint>
    ): IPoint[] =>
      Geometry.Intersection.SegmentsSegments(
        Geometry.Polygon.Segments(polygonA, polygonAOffset),
        Geometry.Polygon.Segments(polygonB, polygonBOffset)
      ),
    PointPairPointPair: (
      first: DeepReadonly<IPointPair>,
      firstType: PointPairType,
      second: DeepReadonly<IPointPair>,
      secondType: PointPairType,
      firstOffset: DeepReadonly<IPoint> = Geometry.Point.Zero,
      secondOffset: DeepReadonly<IPoint> = Geometry.Point.Zero
    ): IPoint | null =>
      Geometry.IntersectionExplicit.PointPairPointPair(
        first.a.x + firstOffset.x,
        first.a.y + firstOffset.y,
        first.b.x + firstOffset.x,
        first.b.y + firstOffset.y,
        firstType,
        second.a.x + secondOffset.x,
        second.a.y + secondOffset.y,
        second.b.x + secondOffset.x,
        second.b.y + secondOffset.y,
        secondType
      ),
  };
}
