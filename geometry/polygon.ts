import { IPoint, Point } from './point';
import { Segment } from './segment';
import { tau } from '@engine-ts/core/utils';

export interface IPolygon {
    vertices: Point[];
}
export class Polygon {
    // counter-clockwise order
    public vertices: Point[] = [];

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

    constructor(points: IPoint[]) {
        points.forEach(point => this.vertices.push(new Point(point.x, point.y)));
    }
}