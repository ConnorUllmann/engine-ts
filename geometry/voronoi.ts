import { tau, moduloSafe } from '../core/utils';
import { Geometry } from './geometry';
import { Point } from './point';
import { IPoint, ITriangle, ICircle } from './interfaces';

export type VoronoiCell = { point: Point, vertices: Point[] };

export function Voronoi(points: IPoint[]): VoronoiCell[] {
    // https://en.wikipedia.org/wiki/Delaunay_triangulation#/media/File:Delaunay_Voronoi.svg
    const cells: VoronoiCell[] = [];
    const triangles: ITriangle[] = Geometry.Points.Triangulation(points);
    points.forEach(point => {
        const neighborTriangles = triangles
            .filter(triangle => Geometry.Triangle.Vertices(triangle)
                .any(vertex => Geometry.Point.AreEqual(vertex, point)));
        const neighborCircumcircles = neighborTriangles
            .map(triangle => Geometry.Triangle.Circumcircle(triangle))
            .sort((a: ICircle, b: ICircle) => 
                moduloSafe(Geometry.Point.Angle(Geometry.Point.Subtract(a, point)), tau) - 
                moduloSafe(Geometry.Point.Angle(Geometry.Point.Subtract(b, point)), tau)
            );
        if(neighborCircumcircles.length > 2) {
            cells.push({
                point: new Point(point.x, point.y),
                vertices: neighborCircumcircles.map(o => new Point(o.x, o.y))
            });
        }
    })
    return cells;
}