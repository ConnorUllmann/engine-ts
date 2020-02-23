import { Point } from './point';
import { Segment } from './segment';
import { Circle } from './circle';
import { tau } from '../core/utils';

export class Triangle {
    constructor(public a: Point, public b: Point, public c: Point) {}

    public get segments(): Segment[] {
        return [
            new Segment(this.a, this.b),
            new Segment(this.b, this.c),
            new Segment(this.c, this.a)
        ];
    }
    public get vertices(): Point[] { return [this.a, this.b, this.c]; }
    public get hash(): string { return this.vertices.sorted().map(o => o.hash).join('|'); }
    public isEqualTo(triangle: Triangle): boolean { return triangle.hash === this.hash; }

    public get circumcircle(): Circle {
        const midpointAB = this.a.midpoint(this.b);
        const perpendicularAB = this.a.subtract(this.b).rotate(tau/4);

        const midpointBC = this.b.midpoint(this.c);
        const perpendicularBC = this.b.subtract(this.c).rotate(tau/4);

        const intersection = Point.linesIntersection(midpointAB, midpointAB.add(perpendicularAB), midpointBC, midpointBC.add(perpendicularBC), false, false);
        if(!intersection)
            throw "No intersection found!";
        
        return new Circle(intersection.x, intersection.y, this.a.distanceTo(intersection));
    }

    public get areaSigned(): number { return 0.5 * (-this.b.y * this.c.x + this.a.y * (-this.b.x + this.c.x) + this.a.x * (this.b.y - this.c.y) + this.b.x * this.c.y); }
    public get area(): number { return Math.abs(this.areaSigned); }

    public collidesPoint(point: Point): boolean { 
        // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
        const areaSigned = this.areaSigned;
        const s = 1/(2*areaSigned)*(this.a.y*this.c.x - this.a.x*this.c.y + (this.c.y - this.a.y)*point.x + (this.a.x - this.c.x)*point.y);
        const t = 1/(2*areaSigned)*(this.a.x*this.b.y - this.a.y*this.b.x + (this.a.y - this.b.y)*point.x + (this.b.x - this.a.x)*point.y);
        return s > 0 && t > 0 && 1 - s - t > 0;
    }

    public static supertriangle(points: Point[]): Triangle {
        const circumcircle = Circle.circumcircleOfPoints(points);
        const diameter = circumcircle.radius * 2;
        return new Triangle(
            circumcircle.add(Point.up.scale(diameter)),
            circumcircle.add(Point.up.rotate(tau/3).scale(diameter)),
            circumcircle.add(Point.up.rotate(tau*2/3).scale(diameter))
        );
    }
    
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