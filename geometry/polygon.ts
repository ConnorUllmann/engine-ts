import { IPoint, Point } from './point';
import { Segment, ISegment } from './segment';
import { tau } from '@engine-ts/core/utils';
import { ILine } from './line';
import { PointPairType, IPointPair, PointPair } from './point-pair';
import { IRay } from './ray';
import { Rectangle } from './rectangle';
import { Triangle } from './triangle';

export interface IPolygon {
    // counter-clockwise order
    // TODO: consider using windingNumber around a point that is known to be inside the polygon to determine if it's clockwise and flip it if so
    vertices: Point[];
    segments: Segment[];
    triangulation: Triangle[];
    boundingRectangle: Rectangle;
    area: number;

    // TODO:
    // collidesRectangle(rectangle: IRectangle): boolean;
    // collidesTriangle(triangle: ITriangle): boolean;
    // collidesCircle(circle: ICircle, rectangleAngle: number=0): boolean
    collidesPoint(point: Point): boolean;
    lineIntersections(line: ILine): Point[];
    rayIntersections(ray: IRay): Point[];
    segmentIntersections(segment: ISegment): Point[];    
}
export class Polygon implements IPolygon {
    public vertices: Point[] = [];

    constructor(points: IPoint[]) {
        points.forEach(point => this.vertices.push(new Point(point.x, point.y)));
    }

    public static segments(polygon: IPolygon): Segment[] { 
        const segments = [];
        for(let i = 0; i < polygon.vertices.length; i++) {
            const j = (i + 1) % polygon.vertices.length;
            segments.push(new Segment(polygon.vertices[i].clonePoint(), polygon.vertices[j].clonePoint()));
        }
        return segments;
    }
    public get segments(): Segment[] { return Polygon.segments(this); }
    public static segmentsWithNormals(polygon: IPolygon): { a: Point, b: Point, normal: Point }[] {
        const segments = [];
        for(let i = 0; i < polygon.vertices.length; i++) {
            const j = (i + 1) % polygon.vertices.length;
            const a = polygon.vertices[i].clonePoint();
            const b = polygon.vertices[j].clonePoint();
            const normal = b.subtract(a).rotated(-tau/4).normalized();
            segments.push({ a, b, normal });
        }
        return segments;
    }
    public segmentsWithNormals(): { a: Point, b: Point, normal: Point }[] { return Polygon.segmentsWithNormals(this); }

    public static windingNumber(vertices: Point[], point: Point): number {
        // https://twitter.com/FreyaHolmer/status/1232826293902888960
        // http://geomalgorithms.com/a03-_inclusion.html

        let windingNumber = 0;
        for(let i = 0; i < vertices.length; i++) {
            const currentVertex = vertices[i];
            const nextVertex = vertices[(i+1)%vertices.length];
            if(currentVertex.y <= point.y) {
                if(nextVertex.y > point.y) {
                    if(point.isLeftOf({ a: currentVertex, b: nextVertex })) {
                        windingNumber++;
                    }
                }
            }
            else {
                if(nextVertex.y <= point.y) {
                    if(point.isRightOf({ a: currentVertex, b: nextVertex })) {
                        windingNumber--;
                    }
                }
            }
        }
        return windingNumber;
    }

    public get boundingRectangle(): Rectangle { return Rectangle.boundingPolygon(this); }
    public get triangulation(): Triangle[] { return Triangle.triangulation(this.vertices); }
    public get area(): number { return this.triangulation.map(o => o.area).sum(); }

    public static collidesPoint(polygon: IPolygon, point: Point) { return Polygon.windingNumber(polygon.vertices, point) != 0; }
    public collidesPoint(point: Point): boolean { return Polygon.collidesPoint(this, point); }
    
    public lineIntersections(line: ILine): Point[] { return Polygon.intersections(this, line, PointPairType.LINE); }
    public rayIntersections(ray: IRay): Point[] { return Polygon.intersections(this, ray, PointPairType.LINE); }
    public segmentIntersections(segment: ISegment): Point[] { return Polygon.intersections(this, segment, PointPairType.LINE); }
    public static intersections(polygon: IPolygon, pair: IPointPair, pairType: PointPairType): Point[] { 
        return Polygon.segments(polygon)
            .map(segment => PointPair.intersection(pair, pairType, segment, PointPairType.SEGMENT))
            .filter(point => point != null);
    }

}