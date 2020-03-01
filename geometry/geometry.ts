import { tau, random, clamp } from '@engine-ts/core/utils';
import { ISegment, IPoint, ICircle, ITriangle, IRectangle, IPointPair, IPolygon, ILine, PointPairType, IRay, IRaycastResult } from './interfaces';

interface IPointsStatic<T> {
    Segments: (o: T) => ISegment[],
    Vertices: (o: T) => IPoint[],
    Circumcircle: (o: T) => ICircle,
    Supertriangle: (o: T) => ITriangle,
    Triangulation: (o: T) => ITriangle[],
    Bounds: (o: T) => IRectangle,
    Hash: (o: T) => string
}

interface IShapeStatic<T> extends IPointsStatic<T> {
    Area: (o: T) => number
}

interface ITriangleStatic extends IShapeStatic<ITriangle> {
    AreaSigned: (triangle: ITriangle) => number
}

interface IRectangleStatic extends IShapeStatic<IRectangle> {
    BoundsRectangles: (rectangles: IRectangle[]) => IRectangle,
    BoundsCircle: (circle: ICircle) => IRectangle
}

interface IPolygonStatic extends IShapeStatic<IPolygon> {
    WindingNumber: (polygon: IPolygon, point: IPoint) => number
}

interface IPointPairStatic<T extends IPointPair> {
    AreEqual: (pairA: T, pairB: T) => boolean,
    YatX: (pair: T, x: number) => number,
    XatY: (pair: T, y: number) => number,
    Slope: (pair: T) => number,
    Hash: (pair: T) => string,
    ClosestPointTo: (pair: T, point: IPoint) => IPoint
}

interface ILineStatic extends IPointPairStatic<ILine> {
};

interface IRayStatic extends IPointPairStatic<IRay> {
    DefaultMaxDistance: number,
    AsSegment: (ray: IRay, length: number) => ISegment,
    PointAtDistance: (ray: IRay, length: number) => IPoint,
    Cast: <T extends ISegment>(ray: IRay, segments: T[], maxDistance: number) => IRaycastResult<T> | null
};

interface ISegmentStatic extends IPointPairStatic<ISegment> {
}

export class Geometry {

    public static Point = {
        Tolerance: 0.00000001,
        IsWithinToleranceOf: (a: number, b: number=0): boolean => Math.abs(a - b) < Geometry.Point.Tolerance,
        AreEqual: (a: IPoint, b: IPoint) => Geometry.Point.IsWithinToleranceOf(Geometry.Point.DistanceSq(a, b)),
        Hash: (point: IPoint) => `${point.x.toFixed(6)},${point.y.toFixed(6)}`,
        Zero: { x: 0, y: 0 },
        One: { x: 1, y: 1 },
        Up: { x: 0, y: -1 },
        Down: { x: 0, y: 1 },
        Left: { x: -1, y: 0 },
        Right: { x: 1, y: 0 },
        DistanceSq: (a: IPoint, b: IPoint): number => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y),
        Distance: (a: IPoint, b: IPoint): number => Math.sqrt(Geometry.Point.DistanceSq(a, b)),
        Add: (a: IPoint, b: IPoint): IPoint => ({ x: a.x + b.x, y: a.y + b.y }),
        Subtract: (a: IPoint, b: IPoint): IPoint => ({ x: a.x - b.x, y: a.y - b.y }),
        Midpoint: (...points: IPoint[]): IPoint | null => {
            if(points.length <= 0)
                return null;
            const sum = { x: 0, y: 0 };
            points.forEach(point => { sum.x += point.x; sum.y += point.y; });
            return {
                x: sum.x / points.length,
                y: sum.y / points.length
            };
        },
        Angle: (point: IPoint): number => Math.atan2(point.y, point.x),
        Scale: (point: IPoint, scalar: number | IPoint): IPoint => {
            return typeof scalar === "number"
                ? { x: point.x * scalar, y: point.y * scalar }
                : { x: point.x * scalar.x, y: point.y * scalar.y }
        },
        LengthSq: (point: IPoint): number => point.x * point.x + point.y * point.y,
        Length: (point: IPoint): number => Math.sqrt(Geometry.Point.LengthSq(point)),
        Dot: (a: IPoint, b: IPoint): number => a.x * b.x + a.y * b.y,
        Cross: (a: IPoint, b: IPoint): number => a.x * b.y - b.x * a.y,
        Proj: (a: IPoint, b: IPoint): IPoint => { 
            return Geometry.Point.Scale(b, Geometry.Point.Dot(a, b) / Math.max(Geometry.Point.LengthSq(b), Geometry.Point.Tolerance)); 
        },
        Normalized: (point: IPoint, length: number=1): IPoint => {
            if((point.x === 0 && point.y === 0) || length === 0)
                return { x: 0, y: 0 };
            const temp = length / Geometry.Point.Length(point);
            return { x: point.x * temp, y: point.y * temp };
        },
        Rotate: (point: IPoint, angle: number, center: IPoint | null=null): IPoint => {
            const x = point.x - (center ? center.x : 0);
            const y = point.y - (center ? center.y : 0);
            return {
                x: (center ? center.x : 0) + x * Math.cos(angle) - y * Math.sin(angle),
                y: (center ? center.y : 0) + y * Math.cos(angle) + x * Math.sin(angle)
            };
        },
        // same as rotating a vector 180 degrees
        Negative: (point: IPoint): IPoint => ({ x: -point.x, y: -point.y }),
        // rotates the point randomly in the range given (about the origin)
        Wiggle: (point: IPoint, angleRangeMax: number): IPoint => Geometry.Point.Rotate(point, angleRangeMax * (random() - 0.5)),
        // Returns how much a (as a vector) faces in the direction of b (as a vector)
        // -1 = a faces opposite the direction of b
        // 0 = a faces perpendicular to the direction of b
        // 1 = a faces the exact same direction as b
        Towardness: (a: IPoint, b: IPoint): number => Geometry.Point.Dot(Geometry.Point.Normalized(a), Geometry.Point.Normalized(b)),
        // t = 0 =  from
        // t = 0.5 = midpoint between from and to
        // t = 1 = to
        Lerp: (from: IPoint, to: IPoint, t: number): IPoint => Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(to, from), t), from),
        // returns a version of this point which is flipped over (rotated 180 degrees around) the given point
        // (or the origin if none is provided). Provided because it is faster than using rotate/reflect.
        Flip: (point: IPoint, center: IPoint | null=null): IPoint => { 
            return center == null
                ? Geometry.Point.Negative(point) 
                : { x: 2 * center.x - point.x, y: 2 * center.y - point.y };
        },
        // reflects the given point over the given line
        Reflect: (point: IPoint, pair: IPointPair): IPoint => {
            // use the Line method for Rays & Segments too
            const reflectionPoint = Geometry.Line.ClosestPointTo(pair, point);
            return Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Subtract(reflectionPoint, point), 2), point);
        },
        ClampedInRectangle: (point: IPoint, rectangle: IRectangle): IPoint => ({
            x: clamp(point.x, rectangle.x, rectangle.x + rectangle.w),
            y: clamp(point.y, rectangle.y, rectangle.y + rectangle.h)
        }),
        // if result is > 0, then this point is left of the line/segment/ray formed by the two points.
        // if result is < 0, then this point is right of the line/segment/ray formed by the two points. 
        // if result == 0, then it is colinear with the two points.
        IsLeftCenterRightOf: (point: IPoint, { a, b }: IPointPair): number => Math.sign((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)),
        IsLeftOf: (point: IPoint, pair: IPointPair): boolean => Geometry.Point.IsLeftCenterRightOf(point, pair) > 0,
        IsColinear: (point: IPoint, pair: IPointPair): boolean => Geometry.Point.IsWithinToleranceOf(Geometry.Point.IsLeftCenterRightOf(point, pair)),
        IsRightOf: (point: IPoint, pair: IPointPair): boolean => Geometry.Point.IsLeftCenterRightOf(point, pair) < 0
    };

    public static PointPair = {
        YatX: (pair: IPointPair, x: number): number => {
            const slope = Geometry.Line.Slope(pair);
            return slope === Number.POSITIVE_INFINITY
                ? Number.POSITIVE_INFINITY
                : slope === Number.NEGATIVE_INFINITY
                    ? Number.NEGATIVE_INFINITY
                    : pair.a.y + (x - pair.a.x) * slope;
        },
        XatY: (pair: IPointPair, y: number): number => {
            const slope = Geometry.Line.Slope(pair);
            return slope === Number.POSITIVE_INFINITY || slope === Number.NEGATIVE_INFINITY
                ? pair.a.x
                : pair.a.x + (y - pair.a.y) / slope;
        },
        Slope: (pair: IPointPair): number => pair.b.x !== pair.a.x 
            ? (pair.b.y - pair.a.y) / (pair.b.x - pair.a.x) 
            : (pair.b.y > pair.a.y 
                ? Number.NEGATIVE_INFINITY 
                : Number.POSITIVE_INFINITY)
    }

    public static Line: ILineStatic = {
        AreEqual: (lineA: ILine, lineB: ILine): boolean => Geometry.Line.Hash(lineA) === Geometry.Line.Hash(lineB),
        YatX: (line: ILine, x: number): number => Geometry.PointPair.YatX(line, x),
        XatY: (line: ILine, y: number): number => Geometry.PointPair.XatY(line, y),
        Slope: (line: ILine): number => Geometry.PointPair.Slope(line),
        Hash: (line: ILine): string => `${Geometry.Line.Slope(line).toFixed(6)}${Geometry.Line.YatX(line, 0).toFixed(6)}`,
        ClosestPointTo: (line: ILine, point: IPoint): IPoint =>
            Geometry.Point.Add(line.a,
                Geometry.Point.Proj(
                    Geometry.Point.Subtract(point, line.a), 
                    Geometry.Point.Subtract(line.b, line.a)
                )
            ),
    };

    public static Ray: IRayStatic = {
        AreEqual: (rayA: IRay, rayB: IRay): boolean => Geometry.Ray.Hash(rayA) === Geometry.Ray.Hash(rayB),
        YatX: (ray: IRay, x: number): number | null => Math.sign(x - ray.a.x) * Math.sign(ray.b.x - ray.a.x) === -1 ? null : Geometry.PointPair.YatX(ray, x),
        XatY: (ray: IRay, y: number): number | null => Math.sign(y - ray.a.y) * Math.sign(ray.b.y - ray.a.y) === -1 ? null : Geometry.PointPair.XatY(ray, y),
        Slope: (ray: IRay): number => Geometry.PointPair.Slope(ray),
        Hash: (ray: IRay): string => Geometry.Points.Hash([ray.a, Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a)), ray.a)]),
        DefaultMaxDistance: 1000000,
        AsSegment: (ray: IRay, length: number=Geometry.Ray.DefaultMaxDistance): ISegment => ({
            a: ray.a, 
            b: Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a)
        }),
        PointAtDistance: (ray: IRay, length: number=Geometry.Ray.DefaultMaxDistance): IPoint => {
            return Geometry.Point.Add(Geometry.Point.Normalized(Geometry.Point.Subtract(ray.b, ray.a), length), ray.a);
        },
        Cast: <T extends ISegment>(ray: IRay, segments: T[], maxDistance: number=Geometry.Ray.DefaultMaxDistance): IRaycastResult<T> | null => {
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
        ClosestPointTo: ({ a, b }: IRay, point: IPoint): IPoint => {
            const ab = Geometry.Point.Subtract(b, a);
            const ret = Geometry.Point.Add(Geometry.Point.Proj(Geometry.Point.Subtract(point, a), ab), a);
            const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
            return r < 0 ? a : ret;
        }
    };

    public static Segment: ISegmentStatic = {
        AreEqual: (segmentA: ISegment, segmentB: ISegment): boolean => Geometry.Segment.Hash(segmentA) === Geometry.Segment.Hash(segmentB),
        YatX: (segment: ISegment, x: number): number | null => 
            Math.sign(x - segment.a.x) * Math.sign(segment.b.x - segment.a.x) === -1 &&
            Math.sign(x - segment.b.x) * Math.sign(segment.a.x - segment.b.x) === -1
                ? Geometry.PointPair.YatX(segment, x)
                : null,
        XatY: (segment: ISegment, y: number): number | null =>
            Math.sign(y - segment.a.y) * Math.sign(segment.b.y - segment.a.y) === -1 &&
            Math.sign(y - segment.b.y) * Math.sign(segment.a.y - segment.b.y) === -1
                ? Geometry.PointPair.XatY(segment, y) 
                : null,
        Slope: (segment: ISegment): number => Geometry.PointPair.Slope(segment),
        Hash: (segment: ISegment): string => Geometry.Points.Hash([segment.a, segment.b]),
        ClosestPointTo: ({ a, b }: ISegment, point: IPoint): IPoint => {
            const ab = Geometry.Point.Subtract(b, a);
            const ret = Geometry.Point.Add(Geometry.Point.Proj(Geometry.Point.Subtract(point, a), ab), a);
            const r = Geometry.Point.Dot(Geometry.Point.Subtract(ret, a), ab);
            if(r < 0) return a;
            if(r > Geometry.Point.LengthSq(ab)) return b;
            return ret;
        }
    };

    public static Triangle: ITriangleStatic = {
        Segments: (triangle: ITriangle): ISegment[] => Geometry.Points.Segments(Geometry.Triangle.Vertices(triangle)),
        Vertices: (triangle: ITriangle): IPoint[] => [triangle.a, triangle.b, triangle.c],
        Circumcircle: (triangle: ITriangle): ICircle => {
            const midpointAB = Geometry.Point.Midpoint(triangle.a, triangle.b);
            const perpendicularAB = Geometry.Point.Rotate(Geometry.Point.Subtract(triangle.a, triangle.b), tau/4);
    
            const midpointBC = Geometry.Point.Midpoint(triangle.b, triangle.c);
            const perpendicularBC = Geometry.Point.Rotate(Geometry.Point.Subtract(triangle.b, triangle.c), tau/4);

            const intersection = Geometry.Intersection.LineLine(
                {
                    a: midpointAB,
                    b: Geometry.Point.Add(midpointAB, perpendicularAB)
                }, 
                {
                    a: midpointBC, 
                    b: Geometry.Point.Add(midpointBC, perpendicularBC)
                }
            );
            if(!intersection)
                throw "No intersection found!";
            
            return {
                x: intersection.x, 
                y: intersection.y, 
                radius: Geometry.Point.Distance(triangle.a, intersection)
            };
        },
        Supertriangle: (triangle: ITriangle): ITriangle => triangle,
        Triangulation: (triangle: ITriangle): ITriangle[] => [triangle],
        Bounds: (triangle: ITriangle): IRectangle => Geometry.Points.Bounds(Geometry.Triangle.Vertices(triangle)),
        Area: (triangle: ITriangle): number => Math.abs(Geometry.Triangle.AreaSigned(triangle)),
        AreaSigned: (triangle: ITriangle): number => 0.5 * (
            -triangle.b.y * triangle.c.x 
            + triangle.a.y * (-triangle.b.x + triangle.c.x) 
            + triangle.a.x * (triangle.b.y - triangle.c.y) 
            + triangle.b.x * triangle.c.y
        ),
        Hash: (triangle: ITriangle): string => Geometry.Points.Hash(Geometry.Triangle.Vertices(triangle))
    }

    public static Rectangle: IRectangleStatic = {
        Segments: (rectangle: IRectangle): ISegment[] => Geometry.Points.Segments(Geometry.Rectangle.Vertices(rectangle)),
        Vertices: (rectangle: IRectangle): IPoint[] => [
            rectangle,
            { x: rectangle.x + rectangle.w, y: rectangle.y },
            { x: rectangle.x + rectangle.w, y: rectangle.y + rectangle.h },
            { x: rectangle.x, y: rectangle.y + rectangle.h}
        ],
        Circumcircle: (rectangle: IRectangle): ICircle => ({
            x: rectangle.x + rectangle.w/2,
            y: rectangle.y + rectangle.h/2,
            radius: Geometry.Point.Length({ x: rectangle.w/2, y: rectangle.h/2 })
        }),
        Supertriangle: (rectangle: IRectangle): ITriangle => Geometry.Points.Supertriangle(Geometry.Rectangle.Vertices(rectangle)),
        Triangulation: (rectangle: IRectangle): ITriangle[] => {
            const corners = Geometry.Rectangle.Vertices(rectangle);
            return [
                { a: corners[1], b: corners[0], c: corners[2] },
                { a: corners[0], b: corners[3], c: corners[2] }
            ];
        },
        Bounds: (rectangle: IRectangle): IRectangle => rectangle,
        BoundsRectangles: (rectangles: IRectangle[]) => {
            if(rectangles == null || rectangles.length <= 0)
                return { x: 0, y: 0, w: 0, h: 0 };
            const xMin = rectangles.map(o => o.x).min();
            const yMin = rectangles.map(o => o.y).min();
            const xMax = rectangles.map(o => o.x + o.w).max();
            const yMax = rectangles.map(o => o.y + o.h).max();
            return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
        },
        BoundsCircle: (circle: ICircle) => ({
            x: circle.x - circle.radius,
            y: circle.y - circle.radius,
            w: circle.radius * 2,h: circle.radius * 2
        }),
        Area: (rectangle: IRectangle): number => rectangle.w * rectangle.h,
        Hash: (rectangle: IRectangle): string => Geometry.Points.Hash(Geometry.Rectangle.Vertices(rectangle))
    }

    public static Polygon: IPolygonStatic = {
        Segments: (polygon: IPolygon): ISegment[] => Geometry.Points.Segments(polygon.vertices),
        Vertices: (polygon: IPolygon): IPoint[] => polygon.vertices.clone(),
        Circumcircle: (polygon: IPolygon): ICircle => Geometry.Points.Circumcircle(polygon.vertices),
        Supertriangle: (polygon: IPolygon): ITriangle => Geometry.Points.Supertriangle(polygon.vertices),
        Triangulation: (polygon: IPolygon): ITriangle[] => Geometry.Points.Triangulation(polygon.vertices),
        Bounds: (polygon: IPolygon): IRectangle => Geometry.Points.Bounds(polygon.vertices),
        Area: (polygon: IPolygon): number => Geometry.Polygon.Triangulation(polygon).map(o => Geometry.Triangle.Area(o)).sum(),
        Hash: (polygon: IPolygon): string => Geometry.Points.Hash(polygon.vertices),
        WindingNumber: (polygon: IPolygon, point: IPoint) : number => {
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

    public static Points: IPointsStatic<IPoint[]> = {
        Segments: (points: IPoint[]): ISegment[] => { 
            const segments = [];
            for(let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length;
                segments.push({ a: points[i], b: points[j] });
            }
            return segments;
        },
        Vertices: (points: IPoint[]): IPoint[] => points.clone(),
        Circumcircle: (points: IPoint[]): ICircle => {
            // Doesn't necessarily fit tightly, but is guaranteed to contain all the points
            const center = Geometry.Point.Midpoint(...points);
            const furthest = points.maxOf(o => Geometry.Point.DistanceSq(center, o));
            const radius = Geometry.Point.Distance(furthest, center);
            return { x: center.x, y: center.y, radius };
        },
        Supertriangle: (points: IPoint[]): ITriangle => {
            const circumcircle = Geometry.Points.Circumcircle(points);
            const diameter = circumcircle.radius * 2;
            return {
                a: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Up, diameter), circumcircle),
                b: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau/3), diameter), circumcircle),
                c: Geometry.Point.Add(Geometry.Point.Scale(Geometry.Point.Rotate(Geometry.Point.Up, tau*2/3), diameter), circumcircle)
            };
        },
        Triangulation: (points: IPoint[]): ITriangle[] => {
            // http://paulbourke.net/papers/triangulate/
    
            // add supertriangle to points and triangles lists
            const supertriangle: ITriangle = Geometry.Points.Supertriangle(points);
            const supertriangleVertices = Geometry.Triangle.Vertices(supertriangle);
            const triangles: ITriangle[] = [supertriangle];
            points.push(...supertriangleVertices);
    
            // create new points because they'll be added to the later triangles anyway
            points.forEach(point => {
    
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
            points.pop();
            points.pop();
            points.pop();
    
            return triangles;
        },
        Bounds: (points: IPoint[]): IRectangle => {
            if(points == null || points.length <= 0)
                return { x: 0, y: 0, w: 0, h: 0 };
            const xMin = points.minOf(o => o.x).x;
            const yMin = points.minOf(o => o.y).y;
            const xMax = points.maxOf(o => o.x).x;
            const yMax = points.maxOf(o => o.y).y;
            return { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
        },
        Hash: (points: IPoint[]): string => points
            .sorted((a, b) => a.y == b.y ? a.x - b.x : a.y - b.y)
            .map(o => Geometry.Point.Hash(o))
            .join('|')
    }

    public static Collide = {
        RectangleRectangle: (rectangleA: IRectangle, rectangleB: IRectangle): boolean => { 
            return rectangleA.x + rectangleA.w > rectangleB.x 
                && rectangleA.y + rectangleA.h > rectangleB.y 
                && rectangleA.x < rectangleB.x + rectangleB.w 
                && rectangleA.y < rectangleB.y + rectangleB.h;
        },
        RectangleCircle: (rectangle: IRectangle, circle: ICircle, rectangleAngle: number=0): boolean => {
            // The rectangle's (x, y) position is its top-left corner if it were not rotated,
            // however the rectangle still rotates about its center (by "rectangleAngle" radians)
            //https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
            const halfW = rectangle.w/2;
            const halfH = rectangle.h/2;
            const circlePosition = rectangleAngle === 0
                ? circle
                : Geometry.Point.Rotate(circle, -rectangleAngle, { x: rectangle.x + halfW, y: rectangle.y + halfH });
            const xCircleDistance = Math.abs(circlePosition.x - rectangle.x + halfW);
            const yCircleDistance = Math.abs(circlePosition.y - rectangle.y + halfH);
    
            if (xCircleDistance > (halfW + circle.radius) || yCircleDistance > (halfH + circle.radius))
                return false;
            if (xCircleDistance <= halfW || yCircleDistance <= halfH)
                return true;
    
            const cornerDistanceSq =
                (xCircleDistance - halfW) * (xCircleDistance - halfW) +
                (yCircleDistance - halfH) * (yCircleDistance - halfH);
            return cornerDistanceSq <= (circle.radius * circle.radius);
        },
        // TODO:
        RectangleTriangle: (rectangle: IRectangle, triangle: ITriangle): boolean => { throw "not implemented" },
        RectanglePolygon: (rectangle: IRectangle, polygon: IPolygon): boolean => { throw "not implemented" },
        RectanglePoint: (rectangle: IRectangle, point: IPoint): boolean => { 
            return point.x >= rectangle.x && point.y >= rectangle.y && point.x < rectangle.x + rectangle.w && point.y < rectangle.y + rectangle.h;
        },
        CircleCircle: (circleA: ICircle, circleB: ICircle): boolean => {
            return Geometry.Point.DistanceSq(circleA, circleB) <= (circleA.radius + circleB.radius) * (circleA.radius + circleB.radius);
        },
        CircleTriangle: (circle: ICircle, triangle: ITriangle): boolean => { throw "not implemented"; },
        CirclePolygon: (circle: ICircle, polygon: IPolygon): boolean => { throw "not implemented"; },
        CirclePoint: (circle: ICircle, point: IPoint): boolean => { 
            return Geometry.Point.DistanceSq(point, circle) <= circle.radius * circle.radius;
        },
        TriangleTriangle: (triangleA: ITriangle, triangleB: ITriangle): boolean => {
            const segmentsA = Geometry.Triangle.Segments(triangleA);
            const segmentsB = Geometry.Triangle.Segments(triangleB);
            // if a segment on either triangle intersects the other, then there is a collision
            if(segmentsA.first(segmentA => 
                    segmentsB.first(segmentB => 
                        Geometry.Intersection.SegmentSegment(segmentA, segmentB
                        ) != null
                    ) != null
                ) != null)
                return true;
            // if there are no intersections but any vertex of one triangle collides with the other, then there is a collision
            return Geometry.Collide.TrianglePoint(triangleA, triangleB.a)
                || Geometry.Collide.TrianglePoint(triangleB, triangleA.a);            
        },
        TrianglePolygon: (triangle: ITriangle, polygon: IPolygon): boolean => { throw "not implemented"; },
        TrianglePoint: (triangle: ITriangle, point: IPoint): boolean => { 
            // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
            const areaSigned2xInverse =  1 / (
                -triangle.b.y * triangle.c.x 
                + triangle.a.y * (-triangle.b.x + triangle.c.x) 
                + triangle.a.x * (triangle.b.y - triangle.c.y) 
                + triangle.b.x * triangle.c.y
            );
            const s = areaSigned2xInverse*(triangle.a.y*triangle.c.x - triangle.a.x*triangle.c.y + (triangle.c.y - triangle.a.y)*point.x + (triangle.a.x - triangle.c.x)*point.y);
            const t = areaSigned2xInverse*(triangle.a.x*triangle.b.y - triangle.a.y*triangle.b.x + (triangle.a.y - triangle.b.y)*point.x + (triangle.b.x - triangle.a.x)*point.y);
            return s > 0 && t > 0 && 1 - s - t > 0;
        },
        PolygonPolygon: (polygonA: IPolygon, polygonB: IPolygon): boolean => { throw "not implemented"; },
        PolygonPoint: (polygon: IPolygon, point: IPoint): boolean => Geometry.Polygon.WindingNumber(polygon, point) != 0
    }

    public static Intersection = {
        LineLine: (lineA: ILine, lineB: ILine): IPoint | null => {
            return Geometry.Intersection.PointPair(lineA, PointPairType.LINE, lineB, PointPairType.LINE);
        },
        LineRay: (line: ILine, ray: IRay): IPoint | null => {
            return Geometry.Intersection.PointPair(line, PointPairType.LINE, ray, PointPairType.RAY);
        },
        LineSegment: (line: ILine, segment: ISegment): IPoint | null => {
            return Geometry.Intersection.PointPair(line, PointPairType.LINE, segment, PointPairType.SEGMENT);
        },
        RayRay: (rayA: IRay, rayB: IRay): IPoint | null => {
            return Geometry.Intersection.PointPair(rayA, PointPairType.RAY, rayB, PointPairType.RAY);
        },
        RaySegment: (ray: IRay, segment: ISegment): IPoint | null => {
            return Geometry.Intersection.PointPair(ray, PointPairType.RAY, segment, PointPairType.SEGMENT);
        },
        SegmentSegment: (segmentA: ISegment, segmentB: ISegment): IPoint | null => {
            return Geometry.Intersection.PointPair(segmentA, PointPairType.SEGMENT, segmentB, PointPairType.SEGMENT);
        },  
        PointPair: (
            first: IPointPair, firstType: PointPairType, 
            second: IPointPair, secondType: PointPairType
        ): IPoint | null => {
            const yFirstLineDiff = first.b.y - first.a.y;
            const xFirstLineDiff = first.a.x - first.b.x;
            const cFirst = first.b.x * first.a.y - first.a.x * first.b.y;
            const ySecondLineDiff = second.b.y - second.a.y;
            const xSecondLineDiff = second.a.x - second.b.x;
            const cSecond = second.b.x * second.a.y - second.a.x * second.b.y;
    
            const denominator = yFirstLineDiff * xSecondLineDiff - ySecondLineDiff * xFirstLineDiff;
            if (denominator === 0)
                return null;
            const intersectionPoint = {
                x: (xFirstLineDiff * cSecond - xSecondLineDiff * cFirst) / denominator,
                y: (ySecondLineDiff * cFirst - yFirstLineDiff * cSecond) / denominator
            };
    
            const beyondFirstA = first.a.x === first.b.x
                ? Math.sign(intersectionPoint.y - first.a.y) !== Math.sign(first.b.y - first.a.y)
                : Math.sign(intersectionPoint.x - first.a.x) !== Math.sign(first.b.x - first.a.x);
            const beyondFirstB = first.a.x === first.b.x
                ? Math.sign(intersectionPoint.y - first.b.y) !== Math.sign(first.a.y - first.b.y)
                : Math.sign(intersectionPoint.x - first.b.x) !== Math.sign(first.a.x - first.b.x);
            const beyondFirst = beyondFirstA || beyondFirstB;
    
            const beyondSecondA = second.a.x === second.b.x
                ? Math.sign(intersectionPoint.y - second.a.y) !== Math.sign(second.b.y - second.a.y)
                : Math.sign(intersectionPoint.x - second.a.x) !== Math.sign(second.b.x - second.a.x);
            const beyondSecondB = second.a.x === second.b.x
                ? Math.sign(intersectionPoint.y - second.b.y) !== Math.sign(second.a.y - second.b.y)
                : Math.sign(intersectionPoint.x - second.b.x) !== Math.sign(second.a.x - second.b.x);
            const beyondSecond = beyondSecondA || beyondSecondB;
    
            return firstType === PointPairType.SEGMENT && beyondFirst
                || firstType === PointPairType.RAY && beyondFirstA
                || secondType === PointPairType.SEGMENT && beyondSecond
                || secondType === PointPairType.RAY && beyondSecondA
                    ? null
                    : intersectionPoint;
        }
    }
}