import { Point } from './point';
import { Line, IPointPair, ILine, PointPairType } from './line';
import { ISegment } from './segment';

export interface IRay extends IPointPair {}
export class Ray implements IRay {
    private _b: Point = new Point();
    public get b(): Point { 
        this._b.x = this.a.x + Math.cos(this.angle);
        this._b.y = this.a.y + Math.sin(this.angle);
        return this._b;
    }

    public static hash(ray: IRay): string { return [ray.a, ray.b].sorted().map(o => o.hash).join('|'); }
    public get hash(): string { return Ray.hash(this); }
    public static areEqual(a: IRay, b: IRay): boolean { return Ray.hash(a) === Ray.hash(b); }
    public isEqualTo(ray: IRay): boolean { return Ray.areEqual(this, ray); }
    public static slope(ray: IRay): number { return Line.slope(ray); }
    public get slope(): number { return Line.slope(this); }

    constructor(public a: Point, public angle: number) { }

    public static lineIntersection(a: IRay, b: ILine) { return Line.intersection(a, PointPairType.RAY, b, PointPairType.LINE); }
    public static rayIntersection(a: IRay, b: IRay) { return Line.intersection(a, PointPairType.RAY, b, PointPairType.RAY); }
    public static segmentIntersection(a: IRay, b: ISegment) { return Line.intersection(a, PointPairType.RAY, b, PointPairType.SEGMENT); }
    public static yAtX(ray: IRay, x: number): number | null { return Math.sign(x - ray.a.x) * Math.sign(ray.b.x - ray.a.x) === -1 ? null : Line.yAtX(ray, x); }
    public static xAtY(ray: IRay, y: number): number | null { return Math.sign(y - ray.a.y) * Math.sign(ray.b.y - ray.a.y) === -1 ? null : Line.xAtY(ray, y); }
    public yAtX(x: number): number { return Ray.yAtX(this, x); }
    public xAtY(y: number): number { return Ray.xAtY(this, y); }

    // public cast(segments: Segment[]): Segment | Ray {}
}