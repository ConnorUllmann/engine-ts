import { Point } from './point';
import { Triangle } from './triangle';
import { Segment } from './segment';

export class Delaunay {
    public static triangulation(points: Point[]): Triangle[] {
        // add supertriangle to points and triangles lists
        const supertriangle: Triangle = Triangle.supertriangle(points);
        const supertriangleVertices = [supertriangle.a, supertriangle.b, supertriangle.c]
        const triangles: Triangle[] = [supertriangle];
        points.push(...supertriangleVertices);
        points.forEach(point => {

            // find all triangles whose circumcircle collides with the given point, remove them, and aggregate their segments into a list
            const segments: Segment[] = [];
            const trianglesToRemove: number[] = [];
            triangles.forEach((triangle, triangleIndex) => {
                const circumcircle = triangle.circumcircle;
                const collides = point.collidesCircle(circumcircle);
                if(collides) {
                    segments.push(...triangle.segments);
                    trianglesToRemove.push(triangleIndex);
                }
            });
            triangles.removeAtMultiple(...trianglesToRemove);

            // remove all internal segments (those that appear twice in the list)
            segments.removeWhere(segment => {
                const hash = segment.hash;
                const equivalentSegments = segments.filter(e => e.hash === hash);
                return equivalentSegments.length >= 2;
            });

            // form triangles out of each segment and the given point and add them to the triangles list
            const newTriangles = segments
                .filter(segment => !segment.a.isEqualTo(segment.b) && !segment.a.isEqualTo(point) && !segment.b.isEqualTo(point))
                .map(segment => new Triangle(
                    segment.a,
                    segment.b,
                    point
                ));
            triangles.push(...newTriangles);
        });

        // remove any triangles that share a vertex with the supertriangle
        triangles.removeWhere(triangle => 
            supertriangleVertices.any(stVertex => 
                [triangle.a, triangle.b, triangle.c].any(vertex => 
                    stVertex.isEqualTo(vertex))));
        
        // return the input list to its original form
        points.removeWhere(point => supertriangleVertices.any(stVertex => stVertex.isEqualTo(point)));

        return triangles;
    }
}