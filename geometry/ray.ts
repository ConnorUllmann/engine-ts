import { Line } from './line';
import { Segment } from './segment';
import { Geometry } from './geometry';
import { IRay, ILine, PointPairType, ISegment, IRaycastResult } from './interfaces';
import { Point } from './point';


export class Ray implements IRay {
    private _b: Point = new Point();
    public get b(): Point { 
        this._b.x = this.a.x + Math.cos(this.angle);
        this._b.y = this.a.y + Math.sin(this.angle);
        return this._b;
    }

    public static readonly DefaultMaxDistance: number = 1000000;
    public get hash(): string { return Geometry.Ray.Hash(this); }
    public isEqualTo(ray: IRay): boolean { return Geometry.Ray.AreEqual(this, ray); }
    public get slope(): number { return Geometry.Ray.Slope(this); }
    public asSegment(length: number=Ray.DefaultMaxDistance): Segment { return Segment.Create(Geometry.Ray.AsSegment(this, length)); }
    public pointAtDistance(length: number=Ray.DefaultMaxDistance): Point { return new Point().setTo(Geometry.Ray.PointAtDistance(this, length)); }
    public YatX(x: number): number { return Geometry.Ray.YatX(this, x); }
    public XatY(y: number): number { return Geometry.Ray.XatY(this, y); }
    public lineIntersection(line: ILine): Point | null { return new Point().setTo(Geometry.Intersection.PointPair(this, PointPairType.RAY, line, PointPairType.LINE)); }
    public rayIntersection(ray: IRay): Point | null { return new Point().setTo(Geometry.Intersection.PointPair(this, PointPairType.RAY, ray, PointPairType.RAY)); }
    public segmentIntersection(segment: ISegment): Point | null { return new Point().setTo(Geometry.Intersection.PointPair(this, PointPairType.RAY, segment, PointPairType.SEGMENT)); }
    public cast<T extends ISegment>(segments: T[], maxDistance: number=Ray.DefaultMaxDistance): IRaycastResult<T> | null { return Geometry.Ray.Cast(this, segments, maxDistance); }
    
    constructor(public a: Point, public angle: number) { }
    public cloneRay(): Ray { return new Ray(this.a.clonePoint(), this.angle); }
}