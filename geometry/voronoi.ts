import { Point } from './point';
import { Triangle } from './triangle';
import { World } from '../core/world';
import { tau, moduloSafe } from '@engine-ts/core/utils';
import { Circle } from './circle';

export type VoronoiCell = { point: Point, vertices: Point[] };

export function Voronoi(points: Point[], world: World): VoronoiCell[] {
    const cells: VoronoiCell[] = [];
    const triangles: Triangle[] = Triangle.triangulation(points);
    points.forEach(point => {
        const neighborTriangles = triangles.filter(triangle => triangle.vertices.any(vertex => vertex.isEqualTo(point)));
        const neighborCircumcircles = neighborTriangles
            .map(triangle => triangle.circumcircle)
            .sorted((a: Circle, b: Circle) => moduloSafe(a.subtract(point).angle, tau) - moduloSafe(b.subtract(point).angle, tau));
        if(neighborCircumcircles.length > 2) {
            cells.push({
                point,
                vertices: neighborCircumcircles
            });
        }
    })
    return cells;
}