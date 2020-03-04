export interface IPoint {
    readonly x: number;
    readonly y: number;
}

export interface ICircle extends IPoint {
    readonly radius: number
}

export interface IRectangle extends IPoint {
    readonly w: number;
    readonly h: number;
}

export interface ITriangle {
    readonly a: IPoint;
    readonly b: IPoint;
    readonly c: IPoint;
}

export interface IPointPair {
    readonly a: IPoint,
    readonly b: IPoint
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
    segments: ISegment[];
    triangulation: ITriangle[];
    circumcircle: ICircle;
    bounds: IRectangle;
    area: number;

    // TODO:
    // collidesPolygon(polygon: IPolygon): boolean;
    // collidesRectangle(rectangle: IRectangle): boolean;
    // collidesTriangle(triangle: ITriangle): boolean;
    // collidesCircle(circle: ICircle, rectangleAngle: number=0): boolean
    collidesPoint(point: IPoint): boolean;
    lineIntersections(line: ILine): IPoint[];
    rayIntersections(ray: IRay): IPoint[];
    segmentIntersections(segment: ISegment): IPoint[];    
}

export enum PointPairType {
    LINE = "LINE",
    SEGMENT = "SEGMENT",
    RAY = "RAY"
}