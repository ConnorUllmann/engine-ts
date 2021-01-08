export interface IPoint {
    x: number;
    y: number;
}

export interface ICircle extends IPoint {
    r: number
}

export interface IRectangle extends IPoint {
    w: number;
    h: number;
}

export interface ITriangle {
    a: IPoint;
    b: IPoint;
    c: IPoint;
}

// omitting the "type" field will default to treating the IPointPair like a segmen
// in ambiguous circumstances (i.e. when in use as the shape for a Collider)
export interface IPointPair {
    a: IPoint,
    b: IPoint,
    type?: PointPairType
}
export interface ILine extends IPointPair {}
export interface IRay extends IPointPair {}
export interface ISegment extends IPointPair {}

export interface IRaycastResult<T extends ISegment> {
    contactPoint: IPoint,
    segmentHit: T
}

export interface IPolygon {
    vertices: IPoint[]; // counter-clockwise order  
}

export enum PointPairType {
    LINE = "LINE",
    SEGMENT = "SEGMENT",
    RAY = "RAY"
}