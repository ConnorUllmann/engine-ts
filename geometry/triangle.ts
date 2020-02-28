import { Point, IPoint } from './point';
import { Segment, ISegment } from './segment';
import { Circle } from './circle';
import { tau } from '../core/utils';
import { ILine } from './line';
import { PointPairType, IPointPair, PointPair } from './point-pair';
import { IRay } from './ray';
import { IPolygon } from './polygon';
import { IRectangle, Rectangle } from './rectangle';

export interface ITriangle {
    readonly a: Point;
    readonly b: Point;
    readonly c: Point;
}
export class Triangle implements ITriangle, IPolygon {
    constructor(public a: Point, public b: Point, public c: Point) {}

    public cloneTriangle(): Triangle { return new Triangle(this.a.clonePoint(), this.b.clonePoint(), this.c.clonePoint()); }

    public get vertices(): Point[] { return [this.a, this.b, this.c]; }
    public static segments(triangle: ITriangle): Segment[] { 
        return [
            new Segment(triangle.a.clonePoint(), triangle.b.clonePoint()),
            new Segment(triangle.b.clonePoint(), triangle.c.clonePoint()),
            new Segment(triangle.c.clonePoint(), triangle.a.clonePoint())
        ];
    }
    public get segments(): Segment[] { return Triangle.segments(this); }
    public static hash(triangle: ITriangle): string { return [triangle.a, triangle.b, triangle.c].sorted(o => o.x).sorted(o => o.y).map(o => o.hash).join('|'); }
    public get hash(): string { return Triangle.hash(this); }
    public isEqualTo(triangle: ITriangle): boolean { return Triangle.hash(triangle) === this.hash; }


    public get circumcircle(): Circle {
        const midpointAB = this.a.midpoint(this.b);
        const perpendicularAB = this.a.subtract(this.b).rotated(tau/4);

        const midpointBC = this.b.midpoint(this.c);
        const perpendicularBC = this.b.subtract(this.c).rotated(tau/4);

        const intersection = Point.linesIntersection(midpointAB, midpointAB.add(perpendicularAB), midpointBC, midpointBC.add(perpendicularBC), false, false);
        if(!intersection)
            throw "No intersection found!";
        
        return new Circle(intersection.x, intersection.y, this.a.distanceTo(intersection));
    }

    public static areaSigned(triangle: ITriangle): number { 
        return 0.5 * (-triangle.b.y * triangle.c.x 
            + triangle.a.y * (-triangle.b.x + triangle.c.x) 
            + triangle.a.x * (triangle.b.y - triangle.c.y) 
            + triangle.b.x * triangle.c.y
        );
    }
    public get areaSigned(): number { return Triangle.areaSigned(this); }
    public get area(): number { return Math.abs(this.areaSigned); }
    public get boundingRectangle(): Rectangle { return Rectangle.boundingPolygon(this); }

    public collidesPoint(point: IPoint): boolean { return Triangle.collidesPoint(this, point); }
    public static collidesPoint(triangle: ITriangle, point: IPoint): boolean { 
        // https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
        const areaSigned = Triangle.areaSigned(triangle);
        const s = 1/(2*areaSigned)*(triangle.a.y*triangle.c.x - triangle.a.x*triangle.c.y + (triangle.c.y - triangle.a.y)*point.x + (triangle.a.x - triangle.c.x)*point.y);
        const t = 1/(2*areaSigned)*(triangle.a.x*triangle.b.y - triangle.a.y*triangle.b.x + (triangle.a.y - triangle.b.y)*point.x + (triangle.b.x - triangle.a.x)*point.y);
        return s > 0 && t > 0 && 1 - s - t > 0;
    }

    public lineIntersections(line: ILine): Point[] { return Triangle.intersections(this, line, PointPairType.LINE); }
    public rayIntersections(ray: IRay): Point[] { return Triangle.intersections(this, ray, PointPairType.LINE); }
    public segmentIntersections(segment: ISegment): Point[] { return Triangle.intersections(this, segment, PointPairType.LINE); }
    public static intersections(triangle: ITriangle, pair: IPointPair, pairType: PointPairType): Point[] { 
        return Triangle.segments(triangle)
            .map(segment => PointPair.intersection(pair, pairType, segment, PointPairType.SEGMENT))
            .filter(point => point != null);
    }

    public static supertriangle(points: IPoint[]): Triangle {
        const circumcircle = Circle.circumcircleOfPoints(points);
        const diameter = circumcircle.radius * 2;
        return new Triangle(
            circumcircle.add(Point.up.scale(diameter)),
            circumcircle.add(Point.up.rotated(tau/3).scale(diameter)),
            circumcircle.add(Point.up.rotated(tau*2/3).scale(diameter))
        );
    }
    
    public get triangulation(): Triangle[] { return [this.cloneTriangle()]; }
    public static triangulation(points: IPoint[]): Triangle[] {
        // http://paulbourke.net/papers/triangulate/

        // add supertriangle to points and triangles lists
        const supertriangle: Triangle = Triangle.supertriangle(points);
        const supertriangleVertices = [supertriangle.a, supertriangle.b, supertriangle.c]
        const triangles: Triangle[] = [supertriangle];
        points.push(...supertriangleVertices);

        // create new points because they'll be added to the later triangles anyway
        points.map(point => new Point(point.x, point.y)).forEach(point => {

            // find all triangles whose circumcircle collides with the given point, remove them, and aggregate their segments into a list
            const segments: Segment[] = [];
            const trianglesToRemove: number[] = [];
            triangles.forEach((triangle, triangleIndex) => {
                const circumcircle = triangle.circumcircle;
                const collides = circumcircle.collidesPoint(point);
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