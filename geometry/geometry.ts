import { tau, random, clamp, moduloSafe, binomialCoefficient, Halign, Valign, ReadonlyKV } from '@engine-ts/core/utils';
import { ISegment, IPoint, ICircle, ITriangle, IRectangle, IPointPair, IPolygon, ILine, PointPairType, IRay, IRaycastResult } from './interfaces';

export type BoundableShape = IPoint | ITriangle | IRectangle | ICircle | IPolygon | ISegment;
export type Shape = BoundableShape | IRay | ILine;

// TODO: change most references from X to ReadonlyKV<X> to indicate that an argument will not be modified and allow Collider.shapeLocal to be used with these functions

interface IGeometryStatic<T> {
    Translate: (t: ReadonlyKV<T>, offset: ReadonlyKV<IPoint>) => T,
    Hash: (t: ReadonlyKV<T>) => string,
    // Can't add Rotate because a rectangle can't truly rotate (must be aligned with x/y axes)
    //Rotate: (t: T, angle: number, center?: ReadonlyKV<IPoint>) => T,
}

interface IPointListStatic<T> extends IGeometryStatic<T> {
    Segments: (t: ReadonlyKV<T>, offset?:ReadonlyKV<IPoint>) => ISegment[],
    Vertices: (t: ReadonlyKV<T>, offset?:ReadonlyKV<IPoint>) => IPoint[],
    Circumcircle: (t: ReadonlyKV<T>) => ICircle,
    Supertriangle: (t: ReadonlyKV<T>) => ITriangle,
    Triangulation: (t: ReadonlyKV<T>) => ITriangle[],
    Bounds: (t: ReadonlyKV<T>) => IRectangle,
    Hash: (t: ReadonlyKV<T>) => string
}

interface IPointsStatic extends IPointListStatic<IPoint[]> {
    Sum: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>) => IPoint,
    BezierPoint: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, t: number) => IPoint,
    Bezier: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, count: number) => IPoint[]
}

interface IShapeStatic<T> extends IPointListStatic<T> {
    Midpoint: (o: ReadonlyKV<T>) => IPoint,
    Area: (o: ReadonlyKV<T>) => number,
}

interface ITriangleStatic extends IShapeStatic<ITriangle> {
    AreaSigned: (triangle: ReadonlyKV<ITriangle>) => number,
    
    // TODO: add these to IShapeStatic<T>
    Perimeter: (triangle: ReadonlyKV<ITriangle>) => number,
    Semiperimeter: (triangle: ReadonlyKV<ITriangle>) => number,

    Incenter: (triangle: ReadonlyKV<ITriangle>) => IPoint,
    Inradius: (triangle: ReadonlyKV<ITriangle>) => number,
    InscribedCircle: (triangle: ReadonlyKV<ITriangle>) => ICircle,
    AngleA: (triangle: ReadonlyKV<ITriangle>) => number,
    AngleB: (triangle: ReadonlyKV<ITriangle>) => number,
    AngleC: (triangle: ReadonlyKV<ITriangle>) => number,
    LengthAB: (triangle: ReadonlyKV<ITriangle>) => number,
    LengthBC: (triangle: ReadonlyKV<ITriangle>) => number,
    LengthCA: (triangle: ReadonlyKV<ITriangle>) => number,
    AngleBisector: (bisectionVertex: ReadonlyKV<IPoint>, previousVertex: ReadonlyKV<IPoint>, nextVertex: ReadonlyKV<IPoint>)=> IRay,
    AngleBisectorA: (triangle: ReadonlyKV<ITriangle>) => IRay,
    AngleBisectorB: (triangle: ReadonlyKV<ITriangle>) => IRay,
    AngleBisectorC: (triangle: ReadonlyKV<ITriangle>) => IRay,
    PerpendicularBisectorAB: (triangle: ReadonlyKV<ITriangle>) => ILine,
    PerpendicularBisectorBC: (triangle: ReadonlyKV<ITriangle>) => ILine,
    PerpendicularBisectorCA: (triangle: ReadonlyKV<ITriangle>) => ILine,
    Rotate: (triangle: ReadonlyKV<ITriangle>, angle: number, center?: ReadonlyKV<IPoint>) => ITriangle
}

interface IRectangleStatic extends IShapeStatic<IRectangle> {
    BoundsRectangles: (rectangles: ReadonlyKV<ReadonlyKV<IRectangle>[]>) => IRectangle,
    Scale: (rectangle: ReadonlyKV<IRectangle>, scalar: number | ReadonlyKV<IPoint>, center?: ReadonlyKV<IPoint>) => IRectangle,
    // Expands this rectangle by the given amount on each side (if hAmount isn't specified, wAmount will be used)
    Expand: (rectangle: ReadonlyKV<IRectangle>, wAmount: number, hAmount?: number) => IRectangle,
    RandomPointInside: (rectangle: ReadonlyKV<IRectangle>) => IPoint,
    Square: (center: ReadonlyKV<IPoint>, sideLength: number) => IRectangle,
    Translate: (rectangle: ReadonlyKV<IRectangle>, translation: ReadonlyKV<IPoint>) => IRectangle,
    Align: (rectangle: ReadonlyKV<IRectangle>, halign: Halign, valign: Valign) => IRectangle,
    Center: (rectangle: ReadonlyKV<IRectangle>) => IPoint,
    TopLeft: (rectangle: ReadonlyKV<IRectangle>) => IPoint,
    TopRight: (rectangle: ReadonlyKV<IRectangle>) => IPoint,
    BottomLeft: (rectangle: ReadonlyKV<IRectangle>) => IPoint,
    BottomRight: (rectangle: ReadonlyKV<IRectangle>) => IPoint,
    xLeft: (rectangle: ReadonlyKV<IRectangle>) => number,
    xRight: (rectangle: ReadonlyKV<IRectangle>) => number,
    yTop: (rectangle: ReadonlyKV<IRectangle>) => number,
    yBottom: (rectangle: ReadonlyKV<IRectangle>) => number,
}

interface IPolygonStatic extends IShapeStatic<IPolygon> {
    WindingNumber: (polygon: ReadonlyKV<IPolygon>, point: ReadonlyKV<IPoint>) => number,
    Rotate: (polygon: ReadonlyKV<IPolygon>, angle: number, center?: ReadonlyKV<IPoint>) => IPolygon
    // TODO: function for creating regular polygons (copy "_getRegularPolygonPoints" in Draw.ts)
}

interface ICircleStatic extends IGeometryStatic<ICircle> {
    Circumcircle: (circle: ReadonlyKV<ICircle>) => ICircle,
    Supertriangle: (o: ReadonlyKV<ICircle>) => ITriangle,
    Midpoint: (o: ReadonlyKV<ICircle>) => IPoint,
    Area: (o: ReadonlyKV<ICircle>) => number,
    Circumference: (o: ReadonlyKV<ICircle>) => number,
    Bounds: (o: ReadonlyKV<ICircle>) => IRectangle,
    RandomPointInside: (circle: ReadonlyKV<ICircle>) => IPoint,
    Rotate: (circle: ReadonlyKV<ICircle>, angle: number, center?: ReadonlyKV<IPoint>) => ICircle,
    // returns the points on 'circle' that are tangent when they form a segment with 'point'
    TangentPoints: (circle: ReadonlyKV<ICircle>, point: ReadonlyKV<IPoint>) => { a: IPoint, b: IPoint } | null
}

interface IPointStatic extends IGeometryStatic<IPoint> {
    readonly Zero: ReadonlyKV<IPoint>,
    readonly One: ReadonlyKV<IPoint>,
    readonly Up: ReadonlyKV<IPoint>,
    readonly Down: ReadonlyKV<IPoint>,
    readonly Left: ReadonlyKV<IPoint>,
    readonly Right: ReadonlyKV<IPoint>,
    readonly UpRight: ReadonlyKV<IPoint>,
    readonly UpLeft: ReadonlyKV<IPoint>,
    readonly DownRight: ReadonlyKV<IPoint>,
    readonly DownLeft: ReadonlyKV<IPoint>,
    AreEqual: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => boolean,
    DistanceSq: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => number,
    Distance: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => number,
    Add: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => IPoint,
    Subtract: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => IPoint,
    Midpoint: (...points: ReadonlyKV<ReadonlyKV<IPoint>[]>) => IPoint | null,
    Angle: (point: ReadonlyKV<IPoint>) => number,
    Scale: (point: ReadonlyKV<IPoint>, scalar: number | ReadonlyKV<IPoint>, from?: ReadonlyKV<IPoint>) => IPoint,
    LengthSq: (point: ReadonlyKV<IPoint>) => number,
    Length: (point: ReadonlyKV<IPoint>) => number,
    Dot: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => number,
    Cross: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => number,
    Project: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => IPoint,
    Normalized: (point: ReadonlyKV<IPoint>, length?: number) => IPoint,
    Rotate: (point: ReadonlyKV<IPoint>, angle: number, center?: ReadonlyKV<IPoint>) => IPoint,
    Negative: (point: ReadonlyKV<IPoint>) => IPoint,
    Wiggle: (point: ReadonlyKV<IPoint>, angleRangeMax: number, center?: ReadonlyKV<IPoint>) => IPoint,
    Towardness: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => number,
    Lerp: (from: ReadonlyKV<IPoint>, to: ReadonlyKV<IPoint>, t: number) => IPoint,
    Flip: (point: ReadonlyKV<IPoint>, center?: ReadonlyKV<IPoint>) => IPoint,
    Reflect: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>) => IPoint,
    ClampedInRectangle: (point: ReadonlyKV<IPoint>, rectangle: ReadonlyKV<IRectangle>) => IPoint,
    Vector: (length: number, angle: number) => IPoint,
    UnitVector: (angle: number) => IPoint,
    IsLeftCenterRightOf: (point: ReadonlyKV<IPoint>, { a, b }: ReadonlyKV<IPointPair>) => number,
    IsLeftOf: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>) => boolean,
    IsColinearWith: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>) => boolean,
    InsideSegmentIfColinear: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<ISegment>) => boolean,
    InsideRayIfColinear: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IRay>) => boolean,
    IsRightOf: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>) => boolean,
    // Returns a list of the velocity vectors a projectile would need in order to hit the (xTarget, yTarget) from (xStart, yStart)
    // given the speed of the shot and gravity. Returns 0, 1, or 2 Points (if two points, the highest-arching vector is first)
    LaunchVectors: (start: ReadonlyKV<IPoint>, target: ReadonlyKV<IPoint>, gravityMagnitude: number, velocityMagnitude: number) => IPoint[]
}

interface IPointPairStatic<T extends IPointPair> {
    AreEqual: (pairA: ReadonlyKV<T>, pairB: ReadonlyKV<T>) => boolean,
    YatX: (pair: ReadonlyKV<T>, x: number) => number,
    XatY: (pair: ReadonlyKV<T>, y: number) => number,
    Slope: (pair: ReadonlyKV<T>) => number,
    Hash: (pair: ReadonlyKV<T>) => string,
    Translate: (pair: ReadonlyKV<T>, offset: ReadonlyKV<IPoint>) => T,
    ClosestPointTo: (pair: ReadonlyKV<T>, point: ReadonlyKV<IPoint>) => IPoint
}

interface ILineStatic extends IPointPairStatic<ILine> {
    Yintercept: (line: ReadonlyKV<ILine>) => number
};

interface IRayStatic extends IPointPairStatic<IRay> {
    DefaultMaxDistance: number,
    AsSegment: (ray: ReadonlyKV<IRay>, length: number) => ISegment,
    PointAtDistance: (ray: ReadonlyKV<IRay>, length: number) => IPoint,
    Cast: (ray: ReadonlyKV<IRay>, segments: ReadonlyKV<ReadonlyKV<ISegment>[]>, maxDistance: number) => IRaycastResult<ISegment> | null,
};

interface ISegmentStatic extends IPointPairStatic<ISegment> {
    Midpoint: (segment: ReadonlyKV<ISegment>) => IPoint,
    PerpendicularBisector: (segment: ReadonlyKV<ISegment>) => ILine,
    SharedVertex: (segmentA: ReadonlyKV<ISegment>, segmentB: ReadonlyKV<ISegment>) => IPoint | null,
    Bounds: (segment: ReadonlyKV<ISegment>) => IRectangle,
}

export class Geometry {

    private static readonly HashDecimalDigits: number = 6;
    private static readonly Tolerance: number = 0.00000001;

    public static IsWithinToleranceOf(a: number, b: number=0): boolean {
        return Math.abs(a - b) < this.Tolerance;
    }

    public static DistanceSq(ax: number, ay: number, bx: number=0, by: number=0): number {
        return (ax - bx) * (ax - bx) + (ay - by) * (ay - by);
    }
    public static Distance(ax: number, ay: number, bx: number=0, by: number=0): number {
        return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
    }
    public static Angle(x: number, y: number): number {
        return Math.atan2(y, x);
    }
    public static AngleDifference(to: number, from: number): number {
        return moduloSafe(to - from - Math.PI, tau) - Math.PI;
    }

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
        AreEqual: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>) => Geometry.IsWithinToleranceOf(Geometry.Point.DistanceSq(a, b)),
        Hash: (point: ReadonlyKV<IPoint>) => `${point.x.toFixed(Geometry.HashDecimalDigits)},${point.y.toFixed(Geometry.HashDecimalDigits)}`,
        DistanceSq: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): number => Geometry.DistanceSq(a.x, a.y, b.x, b.y),
        Distance: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): number => Math.sqrt(Geometry.Point.DistanceSq(a, b)),
        Add: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): IPoint => ({ x: a.x + b.x, y: a.y + b.y }),
        Translate: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): IPoint => ({ x: a.x + b.x, y: a.y + b.y }),
        Subtract: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): IPoint => ({ x: a.x - b.x, y: a.y - b.y }),
        Midpoint: (...points: ReadonlyKV<ReadonlyKV<IPoint>[]>): IPoint | null => {
            if(points.length <= 0)
                return null;
            const sum = { x: 0, y: 0 };
            points.forEach(point => { sum.x += point.x; sum.y += point.y; });
            return {
                x: sum.x / points.length,
                y: sum.y / points.length
            };
        },
        Angle: (point: ReadonlyKV<IPoint>): number => Math.atan2(point.y, point.x),
        Scale: (point: ReadonlyKV<IPoint>, scalar: number | IPoint, from?: ReadonlyKV<IPoint>): IPoint => {
            return from != null
                ? (typeof scalar === "number"
                    ? { x: (point.x - from.x) * scalar + from.x, y: (point.y - from.y) * scalar + from.y }
                    : { x: (point.x - from.x) * scalar.x + from.x, y: (point.y - from.y) * scalar.y + from.y })
                : (typeof scalar === "number"
                    ? { x: point.x * scalar, y: point.y * scalar }
                    : { x: point.x * scalar.x, y: point.y * scalar.y })
        },
        LengthSq: (point: ReadonlyKV<IPoint>): number => point.x * point.x + point.y * point.y,
        Length: (point: ReadonlyKV<IPoint>): number => Math.sqrt(Geometry.Point.LengthSq(point)),
        Dot: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): number => a.x * b.x + a.y * b.y,
        Cross: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): number => a.x * b.y - b.x * a.y,
        Project: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): IPoint => { 
            return Geometry.Point.Scale(b, Geometry.Point.Dot(a, b) / Math.max(Geometry.Point.LengthSq(b), Geometry.Tolerance)); 
        },
        Normalized: (point: ReadonlyKV<IPoint>, length?: number): IPoint => {
            if((point.x === 0 && point.y === 0) || length === 0)
                return { x: 0, y: 0 };
            const temp = (length == undefined ? 1 : length) / Geometry.Point.Length(point);
            return { x: point.x * temp, y: point.y * temp };
        },
        Rotate: (point: ReadonlyKV<IPoint>, angle: number, center?: ReadonlyKV<IPoint>): IPoint => {
            const x = point.x - (center ? center.x : 0);
            const y = point.y - (center ? center.y : 0);
            return {
                x: (center ? center.x : 0) + x * Math.cos(angle) - y * Math.sin(angle),
                y: (center ? center.y : 0) + y * Math.cos(angle) + x * Math.sin(angle)
            };
        },
        // same as rotating a vector 180 degrees
        Negative: (point: ReadonlyKV<IPoint>): IPoint => ({ x: -point.x, y: -point.y }),
        // rotates the point randomly in the range given about the center, or the origin if it is not defined
        Wiggle: (point: ReadonlyKV<IPoint>, angleRangeMax: number, center?: ReadonlyKV<IPoint>): IPoint => Geometry.Point.Rotate(point, angleRangeMax * (random() - 0.5), center),
        // Returns how much a (as a vector) faces in the direction of b (as a vector)
        // -1 = a faces opposite the direction of b
        // 0 = a faces perpendicular to the direction of b
        // 1 = a faces the exact same direction as b
        Towardness: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>): number => Geometry.Point.Dot(Geometry.Point.Normalized(a), Geometry.Point.Normalized(b)),
        // t = 0 =  from
        // t = 0.5 = midpoint between from and to
        // t = 1 = to
        Lerp: (from: ReadonlyKV<IPoint>, to: ReadonlyKV<IPoint>, t: number): IPoint => Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(to, from), t), from),
        // returns a version of this point which is flipped over (rotated 180 degrees around) the given point
        // (or the origin if none is provided). Provided because it is faster than using rotate/reflect.
        Flip: (point: ReadonlyKV<IPoint>, center?: ReadonlyKV<IPoint>): IPoint => { 
            return center
                ? { x: 2 * center.x - point.x, y: 2 * center.y - point.y } 
                : Geometry.Point.Negative(point);
        },
        // reflects the given point over the given line
        Reflect: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>): IPoint => {
            // use the Line method for Rays & Segments too
            const reflectionPoint = Geometry.Line.ClosestPointTo(pair, point);
            return Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(reflectionPoint, point), 2), point);
        },
        ClampedInRectangle: (point: ReadonlyKV<IPoint>, rectangle: ReadonlyKV<IRectangle>): IPoint => ({
            x: clamp(point.x, rectangle.x, rectangle.x + rectangle.w),
            y: clamp(point.y, rectangle.y, rectangle.y + rectangle.h)
        }),
        Vector: (length: number, angle: number): IPoint => ({ x: Math.cos(angle) * length, y: Math.sin(angle) * length }),
        UnitVector: (angle: number): IPoint => Geometry.Point.Vector(1, angle),
        // if result is > 0, then this point is left of the line/segment/ray formed by the two points.
        // if result is < 0, then this point is right of the line/segment/ray formed by the two points. 
        // if result == 0, then it is colinear with the two points.
        IsLeftCenterRightOf: (point: ReadonlyKV<IPoint>, { a, b }: ReadonlyKV<IPointPair>): number => Math.sign((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)),
        IsLeftOf: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>): boolean => Geometry.Point.IsLeftCenterRightOf(point, pair) > 0,
        IsColinearWith: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>): boolean => Geometry.IsWithinToleranceOf(Geometry.Point.IsLeftCenterRightOf(point, pair)),
        InsideSegmentIfColinear: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<ISegment>): boolean => {
            let ap = Geometry.Point.Subtract(point, pair.a);
            let ab = Geometry.Point.Subtract(pair.b, pair.a);
            let v = Geometry.Point.Dot(ap, ab);
            return v >= 0 && v <= Geometry.Point.LengthSq(ab);
        },
        InsideRayIfColinear: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IRay>): boolean => {
            let ap = Geometry.Point.Subtract(point, pair.a);
            let ab = Geometry.Point.Subtract(pair.b, pair.a);
            let v = Geometry.Point.Dot(ap, ab);
            return v >= 0;
        },
        IsRightOf: (point: ReadonlyKV<IPoint>, pair: ReadonlyKV<IPointPair>): boolean => Geometry.Point.IsLeftCenterRightOf(point, pair) < 0,
        // Returns a list of the velocity vectors a projectile would need in order to hit 'target' from 'start'
        // given the speed of the shot and gravity. Returns 0, 1, or 2 Points (if two points, the highest-arching vector is first)
        LaunchVectors: (start: ReadonlyKV<IPoint>, target: ReadonlyKV<IPoint>, gravityMagnitude: number, velocityMagnitude: number) => {
            if(velocityMagnitude === 0)
                return [];
    
            const diff = Geometry.Point.Subtract(target, start);
            if(gravityMagnitude === 0)
                return [Geometry.Point.Normalized(diff, velocityMagnitude)];
    
            const g = -gravityMagnitude;
            const v = velocityMagnitude;
            const v2 = v * v;
            const sqrt = v2 * v2 - g * (g * diff.x * diff.x + 2 * diff.y * v2);
    
            if(diff.x === 0 && sqrt === 0)
                return [Geometry.Point.Vector(Math.sign(diff.x) * v, -tau/4)];
    
            if(diff.x === 0)
                return diff.y > 0
                    ? [{ x: 0, y: v}]
                    : diff.y < 0
                        ? [{ x: 0, y: -v }]
                        : [{ x: 0, y: v }, { x: 0, y: -v }];
    
            if (sqrt < 0)
                return [];
    
            return [
                Geometry.Point.Vector(Math.sign(diff.x) * v, Math.atan((v2 + Math.sqrt(sqrt))/(g * diff.x))),
                Geometry.Point.Vector(Math.sign(diff.x) * v, Math.atan((v2 - Math.sqrt(sqrt))/(g * diff.x)))
            ];
        }
    };

    public static PointPair = {
        YatX: (pair: ReadonlyKV<IPointPair>, x: number): number => {
            const slope = Geometry.Line.Slope(pair);
            return slope === Number.POSITIVE_INFINITY
                ? Number.POSITIVE_INFINITY
                : slope === Number.NEGATIVE_INFINITY
                    ? Number.NEGATIVE_INFINITY
                    : pair.a.y + (x - pair.a.x) * slope;
        },
        XatY: (pair: ReadonlyKV<IPointPair>, y: number): number => {
            const slope = Geometry.Line.Slope(pair);
            return slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY
                ? pair.a.x
                : pair.a.x + (y - pair.a.y) / slope;
        },
        Slope: (pair: ReadonlyKV<IPointPair>): number => pair.b.x !== pair.a.x 
            ? (pair.b.y - pair.a.y) / (pair.b.x - pair.a.x) 
            : (pair.b.y > pair.a.y 
                ? Number.NEGATIVE_INFINITY 
                : Number.POSITIVE_INFINITY)
    }

    public static Line: ILineStatic = {
        AreEqual: (lineA: ReadonlyKV<ILine>, lineB: ReadonlyKV<ILine>): boolean => Geometry.Line.Hash(lineA) === Geometry.Line.Hash(lineB),
        YatX: (line: ReadonlyKV<ILine>, x: number): number => Geometry.PointPair.YatX(line, x),
        XatY: (line: ReadonlyKV<ILine>, y: number): number => Geometry.PointPair.XatY(line, y),
        Slope: (line: ReadonlyKV<ILine>): number => Geometry.PointPair.Slope(line),
        Hash: (line: ReadonlyKV<ILine>): string => `${Geometry.Line.Slope(line).toFixed(6)}${Geometry.Line.YatX(line, 0).toFixed(6)}`,
        Translate: (line: ReadonlyKV<ILine>, offset: ReadonlyKV<IPoint>) => ({
                a: Geometry.Point.Add(line.a, offset),
                b: Geometry.Point.Add(line.b, offset)
            }),
        ClosestPointTo: (line: ReadonlyKV<ILine>, point: ReadonlyKV<IPoint>): IPoint =>
            Geometry.Point.Add(line.a,
                Geometry.Point.Project(
                    Geometry.Point.Subtract(point, line.a), 
                    Geometry.Point.Subtract(line.b, line.a)
                )
            ),
        Yintercept: (line: ReadonlyKV<ILine>): number => Geometry.Line.YatX(line, 0)
    };

    public static Ray: IRayStatic = {
        AreEqual: (rayA: ReadonlyKV<IRay>, rayB: ReadonlyKV<IRay>): boolean => Geometry.Ray.Hash(rayA) === Geometry.Ray.Hash(rayB),
        YatX: (ray: ReadonlyKV<IRay>, x: number): number | null => Math.sign(x - ray.a.x) * Math.sign(ray.b.x - ray.a.x) === -1 ? null : Geometry.PointPair.YatX(ray, x),
        XatY: (ray: ReadonlyKV<IRay>, y: number): number | null => Math.sign(y - ray.a.y) * Math.sign(ray.b.y - ray.a.y) === -1 ? null : Geometry.PointPair.XatY(ray, y),
        Slope: (ray: ReadonlyKV<IRay>): number => Geometry.PointPair.Slope(ray),
        Hash: (ray: ReadonlyKV<IRay>): string => Geometry.Points.Hash([ray.a, Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a)), ray.a)]),
        DefaultMaxDistance: 1000000,
        AsSegment: (ray: ReadonlyKV<IRay>, length: number=Geometry.Ray.DefaultMaxDistance): ISegment => ({
            a: ray.a, 
            b: Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a)
        }),
        PointAtDistance: (ray: ReadonlyKV<IRay>, length: number=Geometry.Ray.DefaultMaxDistance): IPoint => {
            return Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a);
        },
        Cast: (ray: ReadonlyKV<IRay>, segments: ReadonlyKV<ReadonlyKV<ISegment>[]>, maxDistance: number=Geometry.Ray.DefaultMaxDistance): IRaycastResult<ISegment> | null => {
            const raySegment = Geometry.Ray.AsSegment(ray, maxDistance);
            const segmentIntersection = segments
                .map(segment => ({ segment, intersection: Geometry.Intersection.SegmentSegment(raySegment, segment) }))
                .filter(({ segment, intersection }) => intersection != null && segment != null)
                .minOf(({ intersection }) => Geometry.Point.DistanceSq(intersection, ray.a));
            return segmentIntersection == null 
                ? null 
                : {
                    contactPoint: segmentIntersection.intersection,
                    segmentHit: segmentIntersection.segment
                };
        },
        Translate: (ray: ReadonlyKV<IRay>, offset: ReadonlyKV<IPoint>) => ({
                a: Geometry.Point.Add(ray.a, offset),
                b: Geometry.Point.Add(ray.b, offset)
            }),
        ClosestPointTo: ({ a, b }: ReadonlyKV<IRay>, point: ReadonlyKV<IPoint>): IPoint => {
            const ab = Geometry.Point.Subtract(b, a);
            const ret = Geometry.Point.Add(Geometry.Point.Project(Geometry.Point.Subtract(point, a), ab), a);
            const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
            return r < 0 ? a : ret;
        }
    };

    public static Segment: ISegmentStatic = {
        AreEqual: (segmentA: ReadonlyKV<ISegment>, segmentB: ReadonlyKV<ISegment>): boolean => Geometry.Segment.Hash(segmentA) === Geometry.Segment.Hash(segmentB),
        YatX: (segment: ReadonlyKV<ISegment>, x: number): number | null => 
            Math.sign(x - segment.a.x) * Math.sign(segment.b.x - segment.a.x) === -1 &&
            Math.sign(x - segment.b.x) * Math.sign(segment.a.x - segment.b.x) === -1
                ? Geometry.PointPair.YatX(segment, x)
                : null,
        XatY: (segment: ReadonlyKV<ISegment>, y: number): number | null =>
            Math.sign(y - segment.a.y) * Math.sign(segment.b.y - segment.a.y) === -1 &&
            Math.sign(y - segment.b.y) * Math.sign(segment.a.y - segment.b.y) === -1
                ? Geometry.PointPair.XatY(segment, y) 
                : null,
        Slope: (segment: ReadonlyKV<ISegment>): number => Geometry.PointPair.Slope(segment),
        Hash: (segment: ReadonlyKV<ISegment>): string => Geometry.Points.Hash([segment.a, segment.b]),
        Translate: (segment: ReadonlyKV<ISegment>, offset: ReadonlyKV<IPoint>) => ({
                a: Geometry.Point.Add(segment.a, offset),
                b: Geometry.Point.Add(segment.b, offset)
            }),
        ClosestPointTo: ({ a, b }: ReadonlyKV<ISegment>, point: ReadonlyKV<IPoint>): IPoint => {
            const ab = Geometry.Point.Subtract(b, a);
            const ret = Geometry.Point.Add(Geometry.Point.Project(Geometry.Point.Subtract(point, a), ab), a);
            const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
            if(r < 0) return a;
            if(r > Geometry.Point.LengthSq(ab)) return b;
            return ret;
        },
        Midpoint: (segment: ReadonlyKV<ISegment>): IPoint => ({ 
            x: (segment.a.x + segment.b.x) / 2,
            y: (segment.a.y + segment.b.y) / 2
        }),
        PerpendicularBisector: (segment: ReadonlyKV<ISegment>): ILine => {
            const midpoint = Geometry.Segment.Midpoint(segment);
            return {
                a: midpoint,
                b: Geometry.Point.Add(
                    midpoint, 
                    Geometry.Point.Rotate(
                        Geometry.Point.Subtract(segment.b, segment.a),
                        tau/4))
            };
        },
        SharedVertex: (segmentA: ReadonlyKV<ISegment>, segmentB: ReadonlyKV<ISegment>): IPoint | null =>
            Geometry.Point.AreEqual(segmentA.a, segmentB.a) || Geometry.Point.AreEqual(segmentA.a, segmentB.b)
                ? segmentA.a
                : Geometry.Point.AreEqual(segmentA.b, segmentB.a) || Geometry.Point.AreEqual(segmentA.b, segmentB.b)
                    ? segmentA.b
                    : null,
        Bounds: (segment: ReadonlyKV<ISegment>): IRectangle => { 
            const x = Math.min(segment.a.x, segment.b.x);
            const y = Math.min(segment.a.y, segment.b.y);
            const w = Math.max(segment.a.x, segment.b.x) - x;
            const h = Math.max(segment.a.y, segment.b.y) - y;
            return { x, y, w, h };
        }
    };

    public static Triangle: ITriangleStatic = {
        Segments: (triangle: ReadonlyKV<ITriangle>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero): ISegment[] => Geometry.Points.Segments(Geometry.Triangle.Vertices(triangle, offset)),
        Vertices: (triangle: ReadonlyKV<ITriangle>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint[] => [
            { x: triangle.a.x + offset.x, y: triangle.a.y + offset.y },
            { x: triangle.b.x + offset.x, y: triangle.b.y + offset.y },
            { x: triangle.c.x + offset.x, y: triangle.c.y + offset.y },
        ],
        Circumcircle: (triangle: ReadonlyKV<ITriangle>): ICircle => {
            const intersection = Geometry.Intersection.LineLine(
                Geometry.Segment.PerpendicularBisector({ a: triangle.a, b: triangle.b }),
                Geometry.Segment.PerpendicularBisector({ a: triangle.b, b: triangle.c})
            );
            if(!intersection)
                throw "No intersection found!";
            
            return {
                x: intersection.x, 
                y: intersection.y, 
                r: Geometry.Point.Distance(triangle.a, intersection)
            };
        },
        Supertriangle: (triangle: ReadonlyKV<ITriangle>): ITriangle => triangle,
        Triangulation: (triangle: ReadonlyKV<ITriangle>): ITriangle[] => [triangle],
        Bounds: (triangle: ReadonlyKV<ITriangle>): IRectangle => Geometry.Points.Bounds(Geometry.Triangle.Vertices(triangle)),
        Midpoint: (triangle: ReadonlyKV<ITriangle>): IPoint => Geometry.Point.Midpoint(...Geometry.Triangle.Vertices(triangle)),
        Area: (triangle: ReadonlyKV<ITriangle>): number => Math.abs(Geometry.Triangle.AreaSigned(triangle)),
        AreaSigned: (triangle: ReadonlyKV<ITriangle>): number => 0.5 * (
            -triangle.b.y * triangle.c.x 
            + triangle.a.y * (-triangle.b.x + triangle.c.x) 
            + triangle.a.x * (triangle.b.y - triangle.c.y) 
            + triangle.b.x * triangle.c.y
        ),
        Perimeter: (triangle: ReadonlyKV<ITriangle>): number => Geometry.Triangle.LengthAB(triangle) + Geometry.Triangle.LengthBC(triangle) + Geometry.Triangle.LengthCA(triangle),
        Semiperimeter: (triangle: ReadonlyKV<ITriangle>): number => Geometry.Triangle.Perimeter(triangle) / 2,
        Hash: (triangle: ReadonlyKV<ITriangle>): string => Geometry.Points.Hash(Geometry.Triangle.Vertices(triangle)),
        Incenter: (triangle: ReadonlyKV<ITriangle>): IPoint => {
            const bisectorA = Geometry.Triangle.AngleBisectorA(triangle);
            const bisectorB = Geometry.Triangle.AngleBisectorB(triangle);
            const intersection = Geometry.Intersection.RayRay(bisectorA, bisectorB);
            if(!intersection)
                throw `No intersection found between angle bisectors of points "a" and "b" in triangle (${triangle.a}, ${triangle.b}, ${triangle.c}`;
            return intersection;
		},
        Inradius: (triangle: ReadonlyKV<ITriangle>): number => {
            const lengthAB = Geometry.Triangle.LengthAB(triangle);
            const lengthBC = Geometry.Triangle.LengthBC(triangle);
            const lengthCA = Geometry.Triangle.LengthCA(triangle);
            const s = (lengthAB + lengthBC + lengthCA) / 2;
            return Math.sqrt(s * (s - lengthAB) * (s - lengthBC) * (s - lengthCA)) / s;
		},
        InscribedCircle: (triangle: ReadonlyKV<ITriangle>): ICircle => {
            const { x, y } = Geometry.Triangle.Incenter(triangle);
            const radius = Geometry.Triangle.Inradius(triangle);
            return { x, y, r: radius };
		},
        AngleA: (triangle: ReadonlyKV<ITriangle>): number => {
            const angleAB = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.b, triangle.a));
            const angleAC = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.c, triangle.a));
            return Math.abs(angleAC - angleAB);
		},
        AngleB: (triangle: ReadonlyKV<ITriangle>): number => {
            const angleBC = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.c, triangle.b));
            const angleBA = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.a, triangle.b));
            return Math.abs(angleBA - angleBC);
		},
        AngleC: (triangle: ReadonlyKV<ITriangle>): number => {
            const angleCA = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.a, triangle.c));
            const angleCB = Geometry.Point.Angle(Geometry.Point.Subtract(triangle.b, triangle.c));
            return Math.abs(angleCB - angleCA);
		},
        LengthAB: (triangle: ReadonlyKV<ITriangle>): number => Geometry.Point.Distance(triangle.a, triangle.b),
        LengthBC: (triangle: ReadonlyKV<ITriangle>): number => Geometry.Point.Distance(triangle.b, triangle.c),
        LengthCA: (triangle: ReadonlyKV<ITriangle>): number => Geometry.Point.Distance(triangle.c, triangle.a),
        // returns the angle bisector of a given vertex ( vertices ordered: a => b => c )
        AngleBisector: (bisectionVertex: ReadonlyKV<IPoint>, previousVertex: ReadonlyKV<IPoint>, nextVertex: ReadonlyKV<IPoint>): IRay => {
            const angleAB = Geometry.Point.Angle(Geometry.Point.Subtract(nextVertex, bisectionVertex));
            const angleAC = Geometry.Point.Angle(Geometry.Point.Subtract(previousVertex, bisectionVertex));
            const angleBisector = moduloSafe(Geometry.AngleDifference(angleAC, angleAB) / 2 + angleAB, tau);
            return { 
                a: bisectionVertex,
                b: Geometry.Point.Add(bisectionVertex, Geometry.Point.Vector(1, angleBisector))
            }
        },
        AngleBisectorA: ({ a, b, c }: ReadonlyKV<ITriangle>): IRay => Geometry.Triangle.AngleBisector(a, c, b),
        AngleBisectorB: ({ a, b, c }: ReadonlyKV<ITriangle>): IRay => Geometry.Triangle.AngleBisector(b, a, c),
        AngleBisectorC: ({ a, b, c }: ReadonlyKV<ITriangle>): IRay => Geometry.Triangle.AngleBisector(c, b, a),
        PerpendicularBisectorAB: (triangle: ReadonlyKV<ITriangle>): ILine => Geometry.Segment.PerpendicularBisector({ a: triangle.a, b: triangle.b }),
        PerpendicularBisectorBC: (triangle: ReadonlyKV<ITriangle>): ILine => Geometry.Segment.PerpendicularBisector({ a: triangle.b, b: triangle.c }),
        PerpendicularBisectorCA: (triangle: ReadonlyKV<ITriangle>): ILine => Geometry.Segment.PerpendicularBisector({ a: triangle.c, b: triangle.a }),
        Translate: (triangle: ReadonlyKV<ITriangle>, position: ReadonlyKV<IPoint>): ITriangle => ({
            a: Geometry.Point.Add(triangle.a, position),
            b: Geometry.Point.Add(triangle.b, position),
            c: Geometry.Point.Add(triangle.c, position),
        }),
        Rotate: ({ a, b, c }: ReadonlyKV<ITriangle>, angle: number, center?: ReadonlyKV<IPoint>) => ({
            a: Geometry.Point.Rotate(a, angle, center),
            b: Geometry.Point.Rotate(b, angle, center),
            c: Geometry.Point.Rotate(c, angle, center)
        })
    };

    public static Rectangle: IRectangleStatic = {
        Segments: (rectangle: ReadonlyKV<IRectangle>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero): ISegment[] => Geometry.Points.Segments(Geometry.Rectangle.Vertices(rectangle, offset)),
        Vertices: (rectangle: ReadonlyKV<IRectangle>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint[] => [
            { x: rectangle.x + offset.x, y: rectangle.y + offset.y },
            { x: rectangle.x + rectangle.w + offset.x, y: rectangle.y + offset.y },
            { x: rectangle.x + rectangle.w + offset.x, y: rectangle.y + rectangle.h + offset.y },
            { x: rectangle.x + offset.x, y: rectangle.y + rectangle.h + offset.y }
        ],
        Circumcircle: (rectangle: ReadonlyKV<IRectangle>): ICircle => ({
            x: rectangle.x + rectangle.w/2,
            y: rectangle.y + rectangle.h/2,
            r: Geometry.Point.Length({ x: rectangle.w/2, y: rectangle.h/2 })
        }),
        Supertriangle: (rectangle: ReadonlyKV<IRectangle>): ITriangle => Geometry.Points.Supertriangle(Geometry.Rectangle.Vertices(rectangle)),
        Triangulation: (rectangle: ReadonlyKV<IRectangle>): ITriangle[] => {
            const corners = Geometry.Rectangle.Vertices(rectangle);
            return [
                { a: corners[1], b: corners[0], c: corners[2] },
                { a: corners[0], b: corners[3], c: corners[2] }
            ];
        },
        Bounds: (rectangle: ReadonlyKV<IRectangle>): IRectangle => rectangle,
        BoundsRectangles: (rectangles: ReadonlyKV<IRectangle>[]) => {
            if(rectangles == null || rectangles.length <= 0)
                return { x: 0, y: 0, w: 0, h: 0 };
            let xMin = rectangles[0].x;
            let yMin = rectangles[0].y;
            let xMax = rectangles[0].x + rectangles[0].w;
            let yMax = rectangles[0].y + rectangles[0].h;
            for(let i = 1; i < rectangles.length; i++) {
                const rectangle = rectangles[i];
                xMin = Math.min(rectangle.x, xMin);
                yMin = Math.min(rectangle.y, yMin);
                xMax = Math.max(rectangle.x + rectangle.w, xMax);
                yMax = Math.max(rectangle.y + rectangle.h, yMax);
            }
            return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
        },
        Midpoint: (rectangle: ReadonlyKV<IRectangle>): IPoint => ({ x: rectangle.x + rectangle.w/2, y: rectangle.y + rectangle.h/2 }),
        Area: (rectangle: ReadonlyKV<IRectangle>): number => rectangle.w * rectangle.h,
        Hash: (rectangle: ReadonlyKV<IRectangle>): string => Geometry.Points.Hash(Geometry.Rectangle.Vertices(rectangle)),
        // Expands the size of this rectangle by the given amount relative to its current size.
        // "center" defines the position the rectangle is expanding from (if undefined, the top-left of the rectangle is used)
        Scale: (rectangle: ReadonlyKV<IRectangle>, scalar: number | IPoint, center?: ReadonlyKV<IPoint>): IRectangle => {
            if(scalar === 1)
                return rectangle;

            const position = center
                ? Geometry.Point.Add(
                        Geometry.Point.Scale(
                            Geometry.Point.Subtract(rectangle, center),
                            scalar
                        ),
                        center
                    )
                : rectangle;
            
            return typeof scalar === "number"
                ? {
                    x: position.x,
                    y: position.y,
                    w: rectangle.w * scalar,
                    h: rectangle.h * scalar
                }
                : {
                    x: position.x,
                    y: position.y,
                    w: rectangle.w * scalar.x,
                    h: rectangle.h * scalar.y
                }
        },
        Expand: (rectangle: ReadonlyKV<IRectangle>, wAmount: number, hAmount: number=wAmount): IRectangle => ({
            x: rectangle.x - wAmount,
            y: rectangle.y - hAmount,
            w: rectangle.w + 2 * wAmount,
            h: rectangle.h + 2 * hAmount
        }),
        RandomPointInside: (rectangle: ReadonlyKV<IRectangle>): IPoint => ({
            x: rectangle.x + random() * rectangle.w,
            y: rectangle.y + random() * rectangle.h
        }),
        Square: (center: ReadonlyKV<IPoint>, sideLength: number): IRectangle => ({
            x: center.x - sideLength/2,
            y: center.y - sideLength/2,
            w: sideLength,
            h: sideLength
        }),
        Translate: (rectangle: ReadonlyKV<IRectangle>, translation: ReadonlyKV<IPoint>): IRectangle => ({
            x: rectangle.x + translation.x,
            y: rectangle.y + translation.y,
            w: rectangle.w,
            h: rectangle.h
        }),
        Align: (rectangle: ReadonlyKV<IRectangle>, halign: Halign, valign: Valign): IRectangle => {
            const offset = { x: 0, y: 0 };
            switch(halign) {
                case Halign.CENTER:
                    offset.x -= rectangle.w/2;
                    break;
                case Halign.RIGHT:
                    offset.x -= rectangle.w;
                    break;
                case Halign.LEFT:
                default:
                    break;
            }
            switch(valign) {
                case Valign.MIDDLE:
                    offset.y -= rectangle.h/2;
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
        Center: (rectangle: ReadonlyKV<IRectangle>): IPoint => ({
            x: rectangle.x + rectangle.w/2,
            y: rectangle.y + rectangle.h/2
        }),
        TopLeft: (rectangle: ReadonlyKV<IRectangle>): IPoint => rectangle,
        TopRight: (rectangle: ReadonlyKV<IRectangle>): IPoint => ({
            x: rectangle.x + rectangle.w,
            y: rectangle.y
        }),
        BottomLeft: (rectangle: ReadonlyKV<IRectangle>): IPoint => ({
            x: rectangle.x,
            y: rectangle.y + rectangle.h
        }),
        BottomRight: (rectangle: ReadonlyKV<IRectangle>): IPoint => ({
            x: rectangle.x + rectangle.w,
            y: rectangle.y + rectangle.h
        }),
        xLeft: (rectangle: ReadonlyKV<IRectangle>): number => rectangle.x,
        xRight: (rectangle: ReadonlyKV<IRectangle>): number => rectangle.x + rectangle.w,
        yTop: (rectangle: ReadonlyKV<IRectangle>) => rectangle.y,
        yBottom: (rectangle: ReadonlyKV<IRectangle>) => rectangle.y + rectangle.h,
    }

    public static Polygon: IPolygonStatic = {
        Segments: (polygon: ReadonlyKV<IPolygon>, offset?: ReadonlyKV<IPoint>): ISegment[] => Geometry.Points.Segments(offset ? Geometry.Polygon.Vertices(polygon, offset) : polygon.vertices),
        Vertices: (polygon: ReadonlyKV<IPolygon>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint[] => polygon.vertices.map(o => ({ x: o.x + offset.x, y: o.y + offset.y })),
        Circumcircle: (polygon: ReadonlyKV<IPolygon>): ICircle => Geometry.Points.Circumcircle(polygon.vertices),
        Supertriangle: (polygon: ReadonlyKV<IPolygon>): ITriangle => Geometry.Points.Supertriangle(polygon.vertices),
        Triangulation: (polygon: ReadonlyKV<IPolygon>): ITriangle[] => Geometry.Points.Triangulation(polygon.vertices),
        Bounds: (polygon: ReadonlyKV<IPolygon>): IRectangle => Geometry.Points.Bounds(polygon.vertices),
        Midpoint: (polygon: ReadonlyKV<IPolygon>): IPoint => Geometry.Point.Midpoint(...polygon.vertices),
        Area: (polygon: ReadonlyKV<IPolygon>): number => Geometry.Polygon.Triangulation(polygon).map(o => Geometry.Triangle.Area(o)).sum(),
        Rotate: (polygon: ReadonlyKV<IPolygon>, angle: number, center?: ReadonlyKV<IPoint>): IPolygon => ({ vertices: polygon.vertices.map(o => Geometry.Point.Rotate(o, angle, center)) }),
        Translate: (polygon: ReadonlyKV<IPolygon>, position: ReadonlyKV<IPoint>): IPolygon => ({ vertices: polygon.vertices.map(o => Geometry.Point.Add(o, position)) }),
        Hash: (polygon: ReadonlyKV<IPolygon>): string => Geometry.Points.Hash(polygon.vertices),
        WindingNumber: (polygon: ReadonlyKV<IPolygon>, point: ReadonlyKV<IPoint>) : number => {
            // https://twitter.com/FreyaHolmer/status/1232826293902888960
            // http://geomalgorithms.com/a03-_inclusion.html
            let windingNumber = 0;
            for(let i = 0; i < polygon.vertices.length; i++) {
                const currentVertex = polygon.vertices[i];
                const nextVertex = polygon.vertices[(i+1)%polygon.vertices.length];
                if(currentVertex.y <= point.y) {
                    if(nextVertex.y > point.y) {
                        if(Geometry.Point.IsLeftOf(point, { a: currentVertex, b: nextVertex })) {
                            windingNumber++;
                        }
                    }
                }
                else {
                    if(nextVertex.y <= point.y) {
                        if(Geometry.Point.IsRightOf(point,{ a: currentVertex, b: nextVertex })) {
                            windingNumber--;
                        }
                    }
                }
            }
            return windingNumber;
        }
    }

    public static Circle: ICircleStatic = {
        Circumcircle: (circle: ReadonlyKV<ICircle>): ICircle => circle,
        Supertriangle: (circle: ReadonlyKV<ICircle>): ITriangle => ({
            a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, circle.r * 2), circle),
            b: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau/3), circle.r * 2), circle),
            c: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau*2/3), circle.r * 2), circle)
        }),
        Bounds: (circle: ReadonlyKV<ICircle>): IRectangle => ({
            x: circle.x - circle.r,
            y: circle.y - circle.r,
            w: circle.r * 2,
            h: circle.r * 2
        }),
        Midpoint: (circle: ReadonlyKV<ICircle>): IPoint => circle,
        Area: (circle: ReadonlyKV<ICircle>): number => Math.PI * circle.r * circle.r,
        Circumference: (circle: ReadonlyKV<ICircle>): number => tau * circle.r,
        Hash: (circle: ReadonlyKV<ICircle>): string => `${Geometry.Point.Hash(circle)},${circle.r.toFixed(Geometry.HashDecimalDigits)}`,
        RandomPointInside: (circle: ReadonlyKV<ICircle>): IPoint => Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r * random(), tau * random())),
        Translate: (circle: ReadonlyKV<ICircle>, translation: ReadonlyKV<IPoint>): ICircle => ({ x: circle.x + translation.x, y: circle.y + translation.y, r: circle.r }),
        Rotate: (circle: ReadonlyKV<ICircle>, angle: number, center?: ReadonlyKV<IPoint>): ICircle => ({
            ...Geometry.Point.Rotate(circle, angle, center),
            r: circle.r
        }),
        TangentPoints: (circle: ReadonlyKV<ICircle>, point: ReadonlyKV<IPoint>): { a: IPoint, b: IPoint } | null => {
            const distanceSq = Geometry.Point.DistanceSq(circle, point);
            if(distanceSq <= 0 || circle.r <= 0 || distanceSq < circle.r * circle.r)
                return null;
            const angle = Geometry.Point.Angle(Geometry.Point.Subtract(point, circle));
            const angleDiff = Math.acos(circle.r / Math.sqrt(distanceSq));
            return {
                a: Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r, angle + angleDiff)),
                b: Geometry.Point.Add(circle, Geometry.Point.Vector(circle.r, angle - angleDiff))
            }
        }
    }

    public static Points: IPointsStatic = {
        Segments: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero, closed: boolean=true): ISegment[] => { 
            const segments = [];
            for(let i = 0; i < points.length; i++) {
                if(i == points.length-1 && !closed)
                    break;
                const j = (i + 1) % points.length;
                segments.push({
                    a: {
                        x: points[i].x + offset.x,
                        y: points[i].y + offset.y
                    },
                    b: {
                        x: points[j].x + offset.x,
                        y: points[j].y + offset.y
                    }
                });
            }
            return segments;
        },
        Vertices: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, offset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint[] => points.map(o => ({ x: o.x + offset.x, y: o.y + offset.y })),
        Circumcircle: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>): ICircle => {
            // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
            const center = Geometry.Point.Midpoint(...points);
            const furthest = points.maxOf(o => Geometry.Point.DistanceSq(center, o));
            const radius = Geometry.Point.Distance(furthest, center);
            return { x: center.x, y: center.y, r: radius };
        },
        Supertriangle: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>): ITriangle => {
            const circumcircle = Geometry.Points.Circumcircle(points);
            const diameter = circumcircle.r * 2;
            return {
                a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, diameter), circumcircle),
                b: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau/3), diameter), circumcircle),
                c: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau*2/3), diameter), circumcircle)
            };
        },
        Triangulation: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>): ITriangle[] => {
            // http://paulbourke.net/papers/triangulate/
    
            // add supertriangle to points and triangles lists
            const supertriangle: ITriangle = Geometry.Points.Supertriangle(points);
            const supertriangleVertices = Geometry.Triangle.Vertices(supertriangle);
            const triangles: ITriangle[] = [supertriangle];
            const pointsTemp = [
                ...points,
                ...supertriangleVertices
            ]
    
            // create new points because they'll be added to the later triangles anyway
            pointsTemp.forEach(point => {
    
                // find all triangles whose circumcircle collides with the given point, remove them, and aggregate their segments into a list
                const segments: ISegment[] = [];
                triangles.removeWhere(triangle => {
                    const circumcircle = Geometry.Triangle.Circumcircle(triangle);
                    const collides = Geometry.Collide.CirclePoint(circumcircle, point);
                    if(collides) {
                        segments.push(...Geometry.Triangle.Segments(triangle));
                        return true;
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
                    .filter(segment => 
                        !Geometry.Point.AreEqual(segment.a, segment.b) &&
                        !Geometry.Point.AreEqual(segment.a, point) &&
                        !Geometry.Point.AreEqual(segment.b, point)
                    ).map(segment => ({
                        a: segment.b,
                        b: segment.a,
                        c: point
                    }));
                triangles.push(...newTriangles);
            });
    
            // remove any triangles that share a vertex with the supertriangle
            triangles.removeWhere(triangle => 
                supertriangleVertices.any(stVertex => 
                    Geometry.Triangle.Vertices(triangle).any(vertex => 
                        Geometry.Point.AreEqual(stVertex, vertex))));
            
            // return the input list to its original form
            pointsTemp.pop();
            pointsTemp.pop();
            pointsTemp.pop();
    
            return triangles;
        },
        Bounds: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>): IRectangle => {
            if(points == null || points.length <= 0)
                return { x: 0, y: 0, w: 0, h: 0 };
            const xMin = points.minOf(o => o.x).x;
            const yMin = points.minOf(o => o.y).y;
            const xMax = points.maxOf(o => o.x).x;
            const yMax = points.maxOf(o => o.y).y;
            return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
        },
        Hash: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>): string => points.clone()
            .sort((a, b) => a.y == b.y ? a.x - b.x : a.y - b.y)
            .map(o => Geometry.Point.Hash(o))
            .join(';'),
        Translate: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, offset: ReadonlyKV<IPoint>): IPoint[] => points.map(o => Geometry.Point.Translate(o, offset)),
        Sum: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>): IPoint => {
            const sum = { x: 0, y: 0 };
            points.forEach(point => {
                sum.x += point.x;
                sum.y += point.y;
            });
            return sum;
        },
        BezierPoint: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, t: number): IPoint => {
            const n = points.length - 1;
            let sum = { x: 0, y: 0 };
            for(let i = 0; i < points.length; i++)
            {
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
        Bezier: (points: ReadonlyKV<ReadonlyKV<IPoint>[]>, count: number): IPoint[] => {
            if(points.length <= 0 || count < 1)
                return [];
            if(count === 1)
                return [points.first()];
            const bezierPoints = [];
            const coarseness = 1 / (count-1);
            for(let i = 0; i <= 1; i += coarseness)
                bezierPoints.push(Geometry.Points.BezierPoint(points, i));
            return bezierPoints;
        }
    }

    private static IsRectangle(o: any): o is IRectangle { return o.x != null && o.y != null && o.w != null && o.h != null; }
    private static IsCircle(o: any): o is ICircle { return o.x != null && o.y != null && o.r != null; }
    private static IsTriangle(o: any): o is ITriangle { return o.a != null && o.b != null && o.c != null; }
    private static IsPolygon(o: any): o is IPolygon { return o.vertices != null; }
    private static IsLine(o: any): o is ILine { return o.a != null && o.b != null && o.type == PointPairType.LINE; }
    private static IsRay(o: any): o is IRay { return o.a != null && o.b != null && o.type == PointPairType.RAY; }
    // if the "type" field is omitted from a PointPair, it is treated as a Segment by default
    private static IsSegment(o: any): o is ISegment { return o.a != null && o.b != null && (o.type == null || o.type == PointPairType.SEGMENT); }
    private static IsPoint(o: any): o is IPoint { return o.x != null && o.y != null && o.w === undefined && o.r === undefined; }

    public static Bounds(shape?: ReadonlyKV<BoundableShape> | null): IRectangle | null {
        if(!shape)
            null;
        
        if(Geometry.IsRectangle(shape)) {
            return Geometry.Rectangle.Bounds(shape);
        } else if(Geometry.IsCircle(shape)) {
            return Geometry.Circle.Bounds(shape);
        } else if(Geometry.IsTriangle(shape)) {
            return Geometry.Triangle.Bounds(shape);
        } else if(Geometry.IsPolygon(shape)) {
            return Geometry.Polygon.Bounds(shape);
        } else if(Geometry.IsSegment(shape)) {
            return Geometry.Segment.Bounds(shape);
        } else if(Geometry.IsPoint(shape)) {
            return { x: shape.x, y: shape.y, w: 0, h: 0 };
        } 
        return null;
    }

    public static CollideExplicit = {
        RectangleRectangle: (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number,): boolean => {
            return ax + aw > bx 
                && ay + ah > by 
                && ax < bx + bw 
                && ay < by + bh
        },
    }

    // TODO:
    //  1. test all collisions (most ray/segment/line vs shape collisions are untested)
    //  2. add matching collision functions which operate only on number arguments and use them here
    //  3. create matching functions in Geometry.Intersection that actually returns intersection points, if any
    public static Collide = {
        PointSegment: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<ISegment>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => {
            if(aOffset) a = Geometry.Point.Translate(a, aOffset);
            if(bOffset) b = Geometry.Segment.Translate(b, bOffset);
            return Geometry.Point.IsColinearWith(a, b) && Geometry.Point.InsideSegmentIfColinear(a, b)
        },
        TriangleSegment: (a: ReadonlyKV<ITriangle>, b: ReadonlyKV<ISegment>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.TrianglePoint(a, b.a, aOffset, bOffset) || Geometry.Triangle.Segments(a, aOffset).any(o => Geometry.Collide.SegmentSegment(b, o, bOffset)),
        CircleSegment: (a: ReadonlyKV<ICircle>, b: ReadonlyKV<ISegment>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => {
            if(aOffset) a = Geometry.Circle.Translate(a, aOffset);
            if(bOffset) b = Geometry.Segment.Translate(b, bOffset);
            return Geometry.Collide.CirclePoint(a, Geometry.Segment.ClosestPointTo(b, a))
        },
        PolygonSegment: (a: ReadonlyKV<IPolygon>, b: ReadonlyKV<ISegment>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.PolygonPoint(a, b.a, aOffset, bOffset) || Geometry.Polygon.Segments(a, aOffset).any(o => Geometry.Collide.SegmentSegment(b, o, bOffset)),
        PointRay: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IRay>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => {
            if(aOffset) a = Geometry.Point.Translate(a, aOffset);
            if(bOffset) b = Geometry.Ray.Translate(b, bOffset);
            return Geometry.Point.IsColinearWith(a, b) && Geometry.Point.InsideRayIfColinear(a, b)
        },
        TriangleRay: (a: ReadonlyKV<ITriangle>, b: ReadonlyKV<IRay>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.TrianglePoint(a, b.a, aOffset, bOffset) || Geometry.Triangle.Segments(a, aOffset).any(o => Geometry.Collide.RaySegment(b, o, bOffset)),
        CircleRay: (a: ReadonlyKV<ICircle>, b: ReadonlyKV<IRay>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => {
            if(aOffset) a = Geometry.Circle.Translate(a, aOffset);
            if(bOffset) b = Geometry.Ray.Translate(b, bOffset);
            return Geometry.Collide.CirclePoint(a, Geometry.Ray.ClosestPointTo(b, a))
        },
        PolygonRay: (a: ReadonlyKV<IPolygon>, b: ReadonlyKV<IRay>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.PolygonPoint(a, b.a, aOffset, bOffset) || Geometry.Polygon.Segments(a, aOffset).any(o => Geometry.Collide.RaySegment(b, o, bOffset)),
        PointLine: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<ILine>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => {
            if(aOffset) a = Geometry.Point.Translate(a, aOffset);
            if(bOffset) b = Geometry.Line.Translate(b, bOffset);
            return Geometry.Point.IsColinearWith(a, b)
        },
        TriangleLine: (a: ReadonlyKV<ITriangle>, b: ReadonlyKV<ILine>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => Geometry.Collide.TrianglePoint(a, b.a, aOffset, bOffset) || Geometry.Triangle.Segments(a, aOffset).any(o => Geometry.Collide.LineSegment(b, o, bOffset)),
        CircleLine: (a: ReadonlyKV<ICircle>, b: ReadonlyKV<ILine>, aOffset?: ReadonlyKV<IPoint>, bOffset?: ReadonlyKV<IPoint>): boolean => {
            if(aOffset) a = Geometry.Circle.Translate(a, aOffset);
            if(bOffset) b = Geometry.Line.Translate(b, bOffset);
            return Geometry.Collide.CirclePoint(a, Geometry.Line.ClosestPointTo(b, a))
        },
        PolygonLine: (a: ReadonlyKV<IPolygon>, b: ReadonlyKV<ILine>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Collide.PolygonPoint(a, b.a, aOffset, bOffset) || Geometry.Polygon.Segments(a, aOffset).any(o => Geometry.Collide.LineSegment(b, o, bOffset)),
        PointPoint: (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Point.AreEqual(Geometry.Point.Add(a, aOffset), Geometry.Point.Add(b, bOffset)),
        LineLine: (a: ReadonlyKV<ILine>, b: ReadonlyKV<ILine>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.LineLine(a, b, aOffset, bOffset) != null,
        LineRay: (a: ReadonlyKV<ILine>, b: ReadonlyKV<IRay>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.LineRay(a, b, aOffset, bOffset) != null,
        LineSegment: (a: ReadonlyKV<ILine>, b: ReadonlyKV<ISegment>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.LineSegment(a, b, aOffset, bOffset) != null,
        RayRay: (a: ReadonlyKV<IRay>, b: ReadonlyKV<IRay>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.RayRay(a, b, aOffset, bOffset) != null,
        RaySegment: (a: ReadonlyKV<IRay>, b: ReadonlyKV<ISegment>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.RaySegment(a, b, aOffset, bOffset) != null,
        SegmentSegment: (a: ReadonlyKV<ISegment>, b: ReadonlyKV<ISegment>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => Geometry.Intersection.SegmentSegment(a, b, aOffset, bOffset) != null,
        SegmentsSegments: (segmentsA: ReadonlyKV<ReadonlyKV<ISegment>[]>, segmentsB: ReadonlyKV<ReadonlyKV<ISegment>[]>): boolean =>
            segmentsA.any(segmentA => segmentsB.any(segmentB => Geometry.Collide.SegmentSegment(segmentA, segmentB))),
        RectangleRectangle: (rectangleA: ReadonlyKV<IRectangle>, rectangleB: ReadonlyKV<IRectangle>, rectangleAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, rectangleBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => {
            const ax = rectangleA.x + rectangleAOffset.x;
            const ay = rectangleA.y + rectangleAOffset.y;
            const bx = rectangleB.x + rectangleBOffset.x;
            const by = rectangleB.y + rectangleBOffset.y;
            return ax + rectangleA.w > rectangleB.x 
                && ay + rectangleA.h > rectangleB.y 
                && ax < bx + rectangleB.w 
                && ay < by + rectangleB.h
        },
        RectangleCircle: (rectangle: ReadonlyKV<IRectangle>, circle: ReadonlyKV<ICircle>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, rectangleAngle: number=0): boolean => {
            // The rectangle's (x, y) position is its top-left corner if it were not rotated,
            // however the rectangle still rotates about its center (by "rectangleAngle" radians)
            //https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
            const halfW = rectangle.w/2;
            const halfH = rectangle.h/2;
            const rx = rectangle.x + rectangleOffset.x;
            const ry = rectangle.y + rectangleOffset.y;
            let circlePosition = {
                x: circle.x + circleOffset.x,
                y: circle.y + circleOffset.y
            };
            if(rectangleAngle != 0) 
                circlePosition = Geometry.Point.Rotate(circlePosition, -rectangleAngle, { x: rx + halfW, y: ry + halfH });
            const xCircleDistance = Math.abs(circlePosition.x - (rx + halfW));
            const yCircleDistance = Math.abs(circlePosition.y - (ry + halfH));
    
            if (xCircleDistance > halfW + circle.r || yCircleDistance > halfH + circle.r)
                return false;
            if (xCircleDistance <= halfW || yCircleDistance <= halfH)
                return true;
    
            const cornerDistanceSq =
                (xCircleDistance - halfW) * (xCircleDistance - halfW) +
                (yCircleDistance - halfH) * (yCircleDistance - halfH);
            return cornerDistanceSq <= (circle.r * circle.r);
        },
        RectangleTriangle: (rectangle: ReadonlyKV<IRectangle>, triangle: ReadonlyKV<ITriangle>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, triangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Collide.SegmentsSegments(Geometry.Triangle.Segments(triangle, triangleOffset), Geometry.Rectangle.Segments(rectangle, rectangleOffset))
            || Geometry.Collide.TrianglePoint(triangle, rectangle)
            || Geometry.Collide.RectanglePoint(rectangle, triangle.a),
        RectanglePolygon: (rectangle: ReadonlyKV<IRectangle>, polygon: ReadonlyKV<IPolygon>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, polygonOffset?: ReadonlyKV<IPoint>): boolean =>
            Geometry.Collide.SegmentsSegments(Geometry.Polygon.Segments(polygon, polygonOffset), Geometry.Rectangle.Segments(rectangle, rectangleOffset))
            || Geometry.Collide.PolygonPoint(polygon, rectangle)
            || Geometry.Collide.RectanglePoint(rectangle, polygon.vertices.first()),
        RectangleSegment: (rectangle: ReadonlyKV<IRectangle>, segment: ReadonlyKV<ISegment>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, segmentOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => {
            return Geometry.Collide.RectanglePoint(rectangle, segment.a, rectangleOffset, segmentOffset) || Geometry.Collide.RectanglePoint(rectangle, segment.b, rectangleOffset, segmentOffset) || Geometry.Rectangle.Segments(rectangle).any(s => Geometry.Collide.SegmentSegment(s, segment, rectangleOffset, segmentOffset))
        },
        RectangleLine: (rectangle: ReadonlyKV<IRectangle>, line: ReadonlyKV<ILine>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, lineOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.Rectangle.Segments(rectangle).any(s => Geometry.Collide.LineSegment(line, s, lineOffset, rectangleOffset)),
        RectangleRay: (rectangle: ReadonlyKV<IRectangle>, ray: ReadonlyKV<IRay>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, rayOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.Rectangle.Segments(rectangle).any(s => Geometry.Collide.RaySegment(ray, s, rayOffset, rectangleOffset)),
        RectanglePoint: (rectangle: ReadonlyKV<IRectangle>, point: ReadonlyKV<IPoint>, rectangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, pointOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean =>
            point.x + pointOffset.x >= rectangle.x + rectangleOffset.x
             && point.y + pointOffset.y >= rectangle.y + rectangleOffset.y
             && point.x + pointOffset.x < rectangle.x + rectangleOffset.x + rectangle.w
             && point.y + pointOffset.y < rectangle.y + rectangleOffset.y + rectangle.h,
        CircleCircle: (circleA: ReadonlyKV<ICircle>, circleB: ReadonlyKV<ICircle>, circleAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, circleBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.DistanceSq(circleA.x + circleAOffset.x, circleA.y + circleAOffset.y, circleB.x + circleBOffset.x, circleB.y + circleBOffset.y) <= (circleA.r + circleB.r) * (circleA.r + circleB.r),
        CircleTriangle: (circle: ReadonlyKV<ICircle>, triangle: ReadonlyKV<ITriangle>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, triangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Triangle.Segments(triangle).any(segment => Geometry.Intersection.CircleSegment(circle, segment, circleOffset, triangleOffset).length > 0)
            || Geometry.Collide.TrianglePoint(triangle, circle)
            || Geometry.Collide.CirclePoint(circle, triangle.a),
        CirclePolygon: (circle: ReadonlyKV<ICircle>, polygon: ReadonlyKV<IPolygon>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, polygonOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Polygon.Segments(polygon).any(segment => Geometry.Intersection.CircleSegment(circle, segment, circleOffset, polygonOffset).length > 0)
            || Geometry.Collide.PolygonPoint(polygon, circle, polygonOffset, circleOffset)
            || Geometry.Collide.CirclePoint(circle, polygon.vertices.first(), circleOffset, polygonOffset),
        CirclePoint: (circle: ReadonlyKV<ICircle>, point: ReadonlyKV<IPoint>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, pointOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.DistanceSq(point.x + pointOffset.x, point.y + pointOffset.y, circle.x + circleOffset.x, circle.y + circleOffset.y) <= circle.r * circle.r,
        TriangleTriangle: (triangleA: ReadonlyKV<ITriangle>, triangleB: ReadonlyKV<ITriangle>, triangleAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, triangleBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => 
            Geometry.Collide.SegmentsSegments(Geometry.Triangle.Segments(triangleA, triangleAOffset), Geometry.Triangle.Segments(triangleB, triangleBOffset))
            || Geometry.Collide.TrianglePoint(triangleA, triangleB.a, triangleAOffset, triangleBOffset)
            || Geometry.Collide.TrianglePoint(triangleB, triangleA.a, triangleBOffset, triangleAOffset),
        TrianglePolygon: (triangle: ReadonlyKV<ITriangle>, polygon: ReadonlyKV<IPolygon>, triangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, polygonOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean =>
            Geometry.Collide.SegmentsSegments(Geometry.Polygon.Segments(polygon, polygonOffset), Geometry.Triangle.Segments(triangle, triangleOffset))
            || Geometry.Collide.PolygonPoint(polygon, triangle.a, polygonOffset, triangleOffset)
            || Geometry.Collide.TrianglePoint(triangle, polygon.vertices.first(), triangleOffset, polygonOffset),
        TrianglePoint: (triangle: ReadonlyKV<ITriangle>, point: ReadonlyKV<IPoint>, triangleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, pointOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => {
            const triangleAx = triangle.a.x + triangleOffset.x;
            const triangleAy = triangle.a.y + triangleOffset.y;
            const triangleBx = triangle.b.x + triangleOffset.x;
            const triangleBy = triangle.b.y + triangleOffset.y;
            const triangleCx = triangle.c.x + triangleOffset.x;
            const triangleCy = triangle.c.y + triangleOffset.y;
            const pointX = point.x + pointOffset.x;
            const pointY = point.y + pointOffset.y;
            // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
            const areaSigned2xInverse =  1 / (
                -triangleBy * triangleCx 
                + triangleAy * (-triangleBx + triangleCx) 
                + triangleAx * (triangleBy - triangleCy) 
                + triangleBx * triangleCy
            );
            const s = areaSigned2xInverse*(triangleAy*triangleCx - triangleAx*triangleCy + (triangleCy - triangleAy)*pointX + (triangleAx - triangleCx)*pointY);
            const t = areaSigned2xInverse*(triangleAx*triangleBy - triangleAy*triangleBx + (triangleAy - triangleBy)*pointX + (triangleBx - triangleAx)*pointY);
            return s > 0 && t > 0 && 1 - s - t > 0;
        },
        PolygonPolygon: (polygonA: ReadonlyKV<IPolygon>, polygonB: ReadonlyKV<IPolygon>, polygonAOffset?: ReadonlyKV<IPoint>, polygonBOffset?: ReadonlyKV<IPoint>): boolean =>
            Geometry.Collide.SegmentsSegments(Geometry.Polygon.Segments(polygonA, polygonAOffset), Geometry.Polygon.Segments(polygonB, polygonBOffset))
            || Geometry.Collide.PolygonPoint(polygonA, polygonB.vertices.first(), polygonAOffset ?? Geometry.Point.Zero, polygonBOffset ?? Geometry.Point.Zero)
            || Geometry.Collide.PolygonPoint(polygonB, polygonA.vertices.first(), polygonBOffset ?? Geometry.Point.Zero, polygonAOffset ?? Geometry.Point.Zero),
        PolygonPoint: (polygon: ReadonlyKV<IPolygon>, point: ReadonlyKV<IPoint>, polygonOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, pointOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => {            
            point = {
                x: point.x + pointOffset.x - polygonOffset.x,
                y: point.y + pointOffset.y - polygonOffset.y
            }
            return Geometry.Polygon.WindingNumber(polygon, point) != 0
        },
        AnyAny: (a?: ReadonlyKV<Shape>, b?: ReadonlyKV<Shape>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): boolean => {
            if(a == null || b == null)
                return false;
                    
            if(Geometry.IsRectangle(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleRectangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.RectangleCircle(a, b, aOffset, bOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.RectangleTriangle(a, b, aOffset, bOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.RectanglePolygon(a, b, aOffset, bOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.RectangleSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.RectangleRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.RectangleLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.RectanglePoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsCircle(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleCircle(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleCircle(a, b, aOffset, bOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.CircleTriangle(a, b, aOffset, bOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.CirclePolygon(a, b, aOffset, bOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.CircleSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.CircleRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.CircleLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.CirclePoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsTriangle(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleTriangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleTriangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleTriangle(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.TrianglePolygon(a, b, aOffset, bOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.TriangleSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.TriangleRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.TriangleLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.TrianglePoint(a, b, aOffset, bOffset);
                } 
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsPolygon(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectanglePolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CirclePolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TrianglePolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonPolygon(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.PolygonSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.PolygonRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.PolygonLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PolygonPoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
            
            if(Geometry.IsSegment(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.SegmentSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.RaySegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.LineSegment(b, a, bOffset, aOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointSegment(b, a, bOffset, aOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
            
            if(Geometry.IsRay(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.RaySegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.RayRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.LineRay(b, a, bOffset, aOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointRay(b, a, bOffset, aOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
            
            if(Geometry.IsLine(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectangleLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CircleLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TriangleLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.LineSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.LineRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.LineLine(b, a, bOffset, aOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointLine(b, a, bOffset, aOffset);
                } 
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }
                    
            if(Geometry.IsPoint(a)) {
                if(Geometry.IsRectangle(b)) {
                    return Geometry.Collide.RectanglePoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsCircle(b)) {
                    return Geometry.Collide.CirclePoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsTriangle(b)) {
                    return Geometry.Collide.TrianglePoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsPolygon(b)) {
                    return Geometry.Collide.PolygonPoint(b, a, bOffset, aOffset);
                } else if(Geometry.IsSegment(b)) {
                    return Geometry.Collide.PointSegment(a, b, aOffset, bOffset);
                } else if(Geometry.IsRay(b)) {
                    return Geometry.Collide.PointRay(a, b, aOffset, bOffset);
                } else if(Geometry.IsLine(b)) {
                    return Geometry.Collide.PointLine(a, b, aOffset, bOffset);
                } else if(Geometry.IsPoint(b)) {
                    return Geometry.Collide.PointPoint(a, b, aOffset, bOffset);
                }
                throw `Unfamiliar colliding shape b = ${JSON.stringify(b)}`;
            }

            throw `Unfamiliar colliding shape a = ${JSON.stringify(a)}`;
        }
    }


    // given 3 colinear points, returns true if "b" and "c" are on the same side of "a"
    // returns true when "b" or "c" is equal to "a"
    // i.e. used to check if a point has exceeded the endpoint of a PointPair
    //  a = endpoint of PointPair being checked
    //  b = other endpoint of the same PointPair
    //  c = point being checked against the PointPair)
    // TODO: rename 
    private static isSameSideOfPoint = (a: ReadonlyKV<IPoint>, b: ReadonlyKV<IPoint>, c: ReadonlyKV<IPoint>, aOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, bOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, cOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero) => {
        const ax = a.x + aOffset.x;
        const ay = a.y + aOffset.y;
        const bx = b.x + bOffset.x;
        const by = b.y + bOffset.y;
        const cx = c.x + cOffset.x;
        const cy = c.y + cOffset.y;
        return Geometry.IsWithinToleranceOf(ax, bx)
            ? (Math.sign(cy - ay) === Math.sign(by - ay) || Geometry.IsWithinToleranceOf(ay, cy) || Geometry.IsWithinToleranceOf(ay, by))
            : (Math.sign(cx - ax) === Math.sign(bx - ax) || Geometry.IsWithinToleranceOf(ax, cx) || Geometry.IsWithinToleranceOf(ax, bx));
    }

    // TODO:
    //  1. test what happens when the lines/rays/segments are directly atop one another
    //  2. add shape vs. shape intersections as well
    public static Intersection = {
        CirclePointPair: (circle: ReadonlyKV<ICircle>, pair: ReadonlyKV<IPointPair>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, pairOffset?: ReadonlyKV<IPoint>): IPoint[] => {
            if(pairOffset)
                pair = {
                    a: {
                        x: pair.a.x + pairOffset.x,
                        y: pair.a.y + pairOffset.y,
                    },
                    b: {
                        x: pair.b.x + pairOffset.x,
                        y: pair.b.y + pairOffset.y,
                    }
                };
            const cx = circle.x + circleOffset.x;
            const cy = circle.y + circleOffset.y;
            const b = Geometry.Line.Yintercept(pair);
            const m = Geometry.Line.Slope(pair);
            const t = 1 + m * m;
            const u = 2 * b * m - 2 * cy * m - 2 * cx;
            const v = cx * cx + b * b + cy * cy - circle.r * circle.r - 2 * b * cy;

            const sq = u * u - 4 * t * v;
            if(sq < 0)
                return [];
            
            if(sq == 0) {
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
                { x: x2, y: y2 }
            ];
        },
        CircleLine: (circle: ReadonlyKV<ICircle>, line: ReadonlyKV<ILine>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, lineOffset?: ReadonlyKV<IPoint>): IPoint[] =>
            Geometry.Intersection.CirclePointPair(circle, line, circleOffset, lineOffset),
        CircleRay: (circle: ReadonlyKV<ICircle>, ray: ReadonlyKV<IRay>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, rayOffset?: ReadonlyKV<IPoint>): IPoint[] =>
            Geometry.Intersection.CirclePointPair(circle, ray, circleOffset, rayOffset)
                .filter(o => Geometry.isSameSideOfPoint(ray.a, ray.b, o, rayOffset ?? Geometry.Point.Zero, rayOffset ?? Geometry.Point.Zero, circleOffset)),
        CircleSegment: (circle: ReadonlyKV<ICircle>, segment: ReadonlyKV<ISegment>, circleOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, segmentOffset?: ReadonlyKV<IPoint>): IPoint[] =>
            Geometry.Intersection.CirclePointPair(circle, segment, circleOffset, segmentOffset)
                .filter(o =>
                    Geometry.isSameSideOfPoint(segment.a, segment.b, o, segmentOffset ?? Geometry.Point.Zero, segmentOffset ?? Geometry.Point.Zero, circleOffset) && 
                    Geometry.isSameSideOfPoint(segment.b, segment.a, o, segmentOffset ?? Geometry.Point.Zero, segmentOffset ?? Geometry.Point.Zero, circleOffset)
                ),
        LineLine: (lineA: ReadonlyKV<ILine>, lineB: ReadonlyKV<ILine>, lineAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, lineBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(lineA, PointPairType.LINE, lineB, PointPairType.LINE, lineAOffset, lineBOffset),
        LineRay: (line: ReadonlyKV<ILine>, ray: ReadonlyKV<IRay>, lineOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, rayOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(line, PointPairType.LINE, ray, PointPairType.RAY, lineOffset, rayOffset),
        LineSegment: (line: ReadonlyKV<ILine>, segment: ReadonlyKV<ISegment>, lineOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, segmentOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(line, PointPairType.LINE, segment, PointPairType.SEGMENT, lineOffset, segmentOffset),
        RayRay: (rayA: ReadonlyKV<IRay>, rayB: ReadonlyKV<IRay>, rayAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, rayBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(rayA, PointPairType.RAY, rayB, PointPairType.RAY, rayAOffset, rayBOffset),
        RaySegment: (ray: ReadonlyKV<IRay>, segment: ReadonlyKV<ISegment>, rayOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, segmentOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(ray, PointPairType.RAY, segment, PointPairType.SEGMENT, rayOffset, segmentOffset),
        SegmentSegment: (segmentA: ReadonlyKV<ISegment>, segmentB: ReadonlyKV<ISegment>, segmentAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, segmentBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint | null =>
            Geometry.Intersection.PointPair(segmentA, PointPairType.SEGMENT, segmentB, PointPairType.SEGMENT, segmentAOffset, segmentBOffset),
        SegmentsSegments: (segmentsA: ReadonlyKV<ReadonlyKV<ISegment>[]>, segmentsB: ReadonlyKV<ReadonlyKV<ISegment>[]>, segmentsAOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero, segmentsBOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero): IPoint[] =>
            segmentsA.map(segmentA => 
                segmentsB.map(segmentB => 
                    Geometry.Intersection.SegmentSegment(segmentA, segmentB, segmentsAOffset, segmentsBOffset)
                ).filter(o => o != null)
            ).flattened(),
        PolygonPolygon: (polygonA: ReadonlyKV<IPolygon>, polygonB: ReadonlyKV<IPolygon>, polygonAOffset?: ReadonlyKV<IPoint>, polygonBOffset?: ReadonlyKV<IPoint>): IPoint[] =>
            Geometry.Intersection.SegmentsSegments(Geometry.Polygon.Segments(polygonA, polygonAOffset), Geometry.Polygon.Segments(polygonB, polygonBOffset)),
        PointPair: (
            first: ReadonlyKV<IPointPair>, firstType: PointPairType, 
            second: ReadonlyKV<IPointPair>, secondType: PointPairType,
            firstOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero,
            secondOffset: ReadonlyKV<IPoint>=Geometry.Point.Zero
        ): IPoint | null => {
            if(firstOffset && !Geometry.Point.AreEqual(firstOffset, Geometry.Point.Zero))
                first = {
                    a: {
                        x: first.a.x + firstOffset.x,
                        y: first.a.y + firstOffset.y,
                    },
                    b: {
                        x: first.b.x + firstOffset.x,
                        y: first.b.y + firstOffset.y,
                    }
                }
            if(secondOffset && !Geometry.Point.AreEqual(secondOffset, Geometry.Point.Zero))
                second = {
                    a: {
                        x: second.a.x + secondOffset.x,
                        y: second.a.y + secondOffset.y,
                    },
                    b: {
                        x: second.b.x + secondOffset.x,
                        y: second.b.y + secondOffset.y,
                    }
                }
            const yFirstLineDiff = first.b.y - first.a.y;
            const xFirstLineDiff = first.a.x - first.b.x;
            const cFirst = first.b.x * first.a.y - first.a.x * first.b.y;
            const ySecondLineDiff = second.b.y - second.a.y;
            const xSecondLineDiff = second.a.x - second.b.x;
            const cSecond = second.b.x * second.a.y - second.a.x * second.b.y;
    
            const denominator = yFirstLineDiff * xSecondLineDiff - ySecondLineDiff * xFirstLineDiff;
            if (denominator === 0)
                return null;
            const intersection = {
                x: (xFirstLineDiff * cSecond - xSecondLineDiff * cFirst) / denominator,
                y: (ySecondLineDiff * cFirst - yFirstLineDiff * cSecond) / denominator
            };

            if(firstType === PointPairType.LINE && secondType === PointPairType.LINE)
                return intersection;
    
            const beyondFirstA = !Geometry.isSameSideOfPoint(first.a, first.b, intersection);
            const beyondFirstB = !Geometry.isSameSideOfPoint(first.b, first.a, intersection);
            const beyondSecondA = !Geometry.isSameSideOfPoint(second.a, second.b, intersection);
            const beyondSecondB = !Geometry.isSameSideOfPoint(second.b, second.a, intersection)
    
            return firstType === PointPairType.SEGMENT && (beyondFirstA || beyondFirstB)
                || firstType === PointPairType.RAY && beyondFirstA
                || secondType === PointPairType.SEGMENT && (beyondSecondA || beyondSecondB)
                || secondType === PointPairType.RAY && beyondSecondA
                    ? null
                    : intersection;
        }
    }
}
