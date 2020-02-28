import { IPoint, Point } from './point';
import { Segment } from './segment';
import { tau } from '@engine-ts/core/utils';

export interface IPolygon {
    vertices: Point[];
}
export class Polygon {
    // counter-clockwise order
    // TODO: consider using windingNumber around a point that is known to be inside the polygon to determine if it's clockwise and flip it if so
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
    public segments(): Segment[] { return Polygon.segments(this); }
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

    public static collidesPoint(polygon: IPolygon, point: Point) { return Polygon.windingNumber(polygon.vertices, point) != 0; }
    public collidesPoint(point: Point): boolean { return Polygon.collidesPoint(this, point); }
}