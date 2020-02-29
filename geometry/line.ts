import { Geometry } from './geometry';
import { ILine, IPointPair, PointPairType, IRay, ISegment } from './interfaces';
import { Point } from './point';

export class Line implements ILine {
    public get hash(): string { return Geometry.Line.Hash(this); }
    public isEqualTo(line: ILine): boolean { return Geometry.Line.AreEqual(this, line); }
    public get slope(): number { return Geometry.Line.Slope(this); }
    public YatX(x: number): number { return Geometry.Line.YatX(this, x); }
    public XatY(y: number): number { return Geometry.Line.XatY(this, y); }
    public lineIntersection(line: ILine): Point | null { return new Point().setTo(Geometry.Intersection.PointPair(this, PointPairType.LINE, line, PointPairType.LINE)); }
    public rayIntersection(ray: IRay): Point | null { return new Point().setTo(Geometry.Intersection.PointPair(this, PointPairType.LINE, ray, PointPairType.RAY)); }
    public segmentIntersection(segment: ISegment): Point | null { return new Point().setTo(Geometry.Intersection.PointPair(this, PointPairType.LINE, segment, PointPairType.SEGMENT)); }

    constructor(public a: Point, public b: Point) {}
}