import { Point } from './point';
import { Line, ILine } from './line';
import { IPointPair, PointPairType, PointPair } from './point-pair';
import { ISegment, Segment } from './segment';
import { IRectangle } from './rectangle';
import { ITriangle } from './triangle';

export interface IRay extends IPointPair {}
export class Ray implements IRay {
    private _b: Point = new Point();
    public get b(): Point { 
        this._b.x = this.a.x + Math.cos(this.angle);
        this._b.y = this.a.y + Math.sin(this.angle);
        return this._b;
    }

    public static readonly DefaultMaxDistance: number = 1000000;
    public static hash(ray: IRay): string { return [ray.a, ray.b].sorted().map(o => o.hash).join('|'); }
    public get hash(): string { return Ray.hash(this); }
    public static areEqual(a: IRay, b: IRay): boolean { return Ray.hash(a) === Ray.hash(b); }
    public isEqualTo(ray: IRay): boolean { return Ray.areEqual(this, ray); }
    public static slope(ray: IRay): number { return Line.slope(ray); }
    public get slope(): number { return Line.slope(this); }
    public static asSegment(ray: IRay, length: number=Ray.DefaultMaxDistance): Segment { return new Segment(ray.a.clonePoint(), ray.b.subtract(ray.a).normalized(length).add(ray.a)); }
    public asSegment(length: number=Ray.DefaultMaxDistance): Segment { return Ray.asSegment(this, length); }
    public static atDistance(ray: IRay, length: number=Ray.DefaultMaxDistance): Point { return ray.b.subtract(ray.a).normalized(length).add(ray.a); }
    public atDistance(length: number=Ray.DefaultMaxDistance): Point { return Ray.atDistance(this, length); }
    public static yAtX(ray: IRay, x: number): number | null { return Math.sign(x - ray.a.x) * Math.sign(ray.b.x - ray.a.x) === -1 ? null : Line.yAtX(ray, x); }
    public yAtX(x: number): number { return Ray.yAtX(this, x); }
    public static xAtY(ray: IRay, y: number): number | null { return Math.sign(y - ray.a.y) * Math.sign(ray.b.y - ray.a.y) === -1 ? null : Line.xAtY(ray, y); }
    public xAtY(y: number): number { return Ray.xAtY(this, y); }
    public lineIntersection(line: ILine): Point | null { return PointPair.intersection(this, PointPairType.RAY, line, PointPairType.LINE); }
    public rayIntersection(ray: IRay): Point | null { return PointPair.intersection(this, PointPairType.RAY, ray, PointPairType.RAY); }
    public segmentIntersection(segment: ISegment): Point | null { return PointPair.intersection(this, PointPairType.RAY, segment, PointPairType.SEGMENT); }
    public rectangleIntersection(rectangle: IRectangle): Point[] { return PointPair.rectangleIntersection(this, PointPairType.RAY, rectangle); }
    public triangleIntersection(triangle: ITriangle): Point[] { return PointPair.triangleIntersection(this, PointPairType.RAY, triangle); }

    constructor(public a: Point, public angle: number) { }

    public static cast = function<T extends ISegment>(ray: IRay, segments: T[], maxDistance: number=Ray.DefaultMaxDistance): RaycastResult<T> {
        const raySegment = Ray.asSegment(ray, maxDistance);
        const segmentIntersection = segments
            .map(segment => ({ segment, intersection: raySegment.segmentIntersection(segment) }))
            .filter(({ segment, intersection }) => intersection != null && segment != null)
            .minOf(({ intersection }) => intersection.distanceSqTo(ray.a));
        const hit = segmentIntersection && segmentIntersection.intersection.distanceSqTo(ray.a) <= maxDistance * maxDistance;
        return {
            contactPoint: hit ? segmentIntersection.intersection : raySegment.b,
            segmentHit: hit ? segmentIntersection.segment : null
        }
    }
    public cast = function<T extends ISegment>(segments: T[], maxDistance: number=Ray.DefaultMaxDistance): RaycastResult<T> { return Ray.cast(this, segments, maxDistance); }
}

export interface RaycastResult<T extends ISegment> {
    contactPoint: Point,
    segmentHit: T
}