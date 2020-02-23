import { Point } from './point';
import { Rectangle } from './rectangle';
import { Draw } from '../visuals/draw';
import { Color } from '../visuals/color';
import { World } from '../core/world';
import { tau } from '../core/utils';


export class Segment {
    public a: Point;
    public b: Point;

    constructor(_a: Point, _b: Point) {
        this.a = _a.clonePoint();
        this.b = _b.clonePoint();
    }

    public get hash(): string { return this.a.x < this.b.x ? `${this.a.hash}|${this.b.hash}` : `${this.b.hash}|${this.a.hash}` }
    public get midpoint(): Point { return this.a.midpoint(this.b); }

    public isEqualTo(edge: Segment): boolean {
        const thisMinPoint = this.a.x < this.b.x ? this.a : this.b;
        const thisMaxPoint = this.a == thisMinPoint ? this.b : this.a;
        const edgeMinPoint = edge.a.x < edge.b.x ? edge.a : edge.b;
        const edgeMaxPoint = edge.a == thisMinPoint ? edge.b : edge.a;
        return thisMinPoint.isEqualTo(edgeMinPoint) && thisMaxPoint.isEqualTo(edgeMaxPoint);
    }
}

export class Cell {
    public edges: Segment[] = [];
    constructor(public site: Point) {}
}

export function Voronoi(outerBounds: Rectangle, sites: Point[],
        drawSite: (site: Point, emphasize?: boolean) => void,
        drawEdge: (edge: Segment, emphasize?: boolean) => void,
        drawCell: (cell: Cell, emphasize?: boolean) => void,
        clear: () => void,
        world: World): { edges: Segment[], cells: Cell[] } {
    const bounds = new Rectangle(outerBounds.x + outerBounds.w/4, outerBounds.y + outerBounds.h/4, outerBounds.w/2, outerBounds.h/2);
    const boundsCorners = bounds.corners;
    const outerBoundsSegments = outerBounds.segments;
    const cells = boundsCorners.map((corner: Point) => {
        const rectangle = new Rectangle(corner.x - bounds.w/2, corner.y - bounds.h/2, bounds.w, bounds.h);
        const rectangleCorners = rectangle.corners;
        const edges = [
            new Segment(rectangleCorners[0], rectangleCorners[1]),
            new Segment(rectangleCorners[1], rectangleCorners[2]),
            new Segment(rectangleCorners[2], rectangleCorners[3]),
            new Segment(rectangleCorners[3], rectangleCorners[0])
        ];
        const cell = new Cell(corner);
        cell.edges = edges;
        return cell;
    });

    //const edges = cells.map(o => o.edges).flattened();

    const drawDebug = (emphasizedSites?: Point[], emphasizedEdges?: Segment[], emphasizedCells?: Cell[]) => {
        clear();
        //boundsCorners.forEach((corner: Point) => drawSite(corner, false));
        //sites.forEach((site: Point) => drawSite(site, false));
        //edges.forEach((edge: Edge) => drawEdge(edge, false));
        cells.forEach((cell: Cell) => drawCell(cell, false));
        if(emphasizedCells)
            emphasizedCells.forEach(emphasizedCell => drawCell(emphasizedCell, true));
        if(emphasizedEdges)
            emphasizedEdges.forEach(emphasizedEdge => drawEdge(emphasizedEdge, true));
        if(emphasizedSites)
            emphasizedSites.forEach(emphasizedSite => drawSite(emphasizedSite, true));
    }

    sites.forEach((site: Point, siteIndex: number) => {
        const siteCell = new Cell(site);
        cells.forEach((cell: Cell, cellIndex: number) => {
            console.log(`Site[${siteIndex}] Cell[${cellIndex}]`);
            if(siteIndex === 3 && cellIndex === 1)
                debugger;
            drawDebug([site, cell.site], [], [cell]);

            const midpoint = cell.site.midpoint(site);
            const perpendicular = cell.site.subtract(site).rotate(tau / 4).normalized();

            Draw.circle(world, midpoint.x, midpoint.y, 3, Color.cyan);
            Draw.line(world, midpoint.x, midpoint.y, midpoint.x + perpendicular.x * 10, midpoint.y + perpendicular.y * 10, Color.yellow, 1);

            const intersections: Point[] = [];
            const edgesToRemove: Segment[] = [];
            cell.edges.forEach((edge: Segment) => {
                drawDebug([site, cell.site], [edge], [cell]);
                //if(cellIndex === 6)
                //    debugger;
                   
                const intersection = Point.linesIntersection(edge.a, edge.b, midpoint, midpoint.add(perpendicular), true, false);
                if(intersection != null) {
                    intersections.push(intersection);
                    const a = [edge.a, edge.b].maxOf(o => o.distanceSqTo(site)); // !edge.midpoint.leftOfLine(midpoint, midpoint.add(perpendicular)) ? edge.a : edge.b; //
                    edge.a = a.clonePoint();
                    edge.b = intersection.clonePoint();
                }
                else {
                    const nearSide: boolean = edge.midpoint.distanceSqTo(site) < edge.midpoint.distanceSqTo(cell.site);
                    if(nearSide)
                        edgesToRemove.push(edge);
                }
                drawDebug([site, cell.site], [edge], [cell]);
            })
            intersections.forEach(intersection => Draw.circle(world, intersection.x, intersection.y, 5, Color.magenta));
            const createEdge = (a: Point, b:Point) => {
                //edges.push(new Edge(a, b));
                cell.edges.push(new Segment(a, b));
                siteCell.edges.push(new Segment(a, b));
            }
            if(intersections.length === 2) {
                createEdge(intersections[0], intersections[1]);
            }
            else {
                const boundsIntersections = outerBoundsSegments.map((segment: { a: Point, b: Point }) => {
                    return Point.linesIntersection(segment.a, segment.b, midpoint, midpoint.add(perpendicular), true, false);
                }).filter(o => o != null);
                if(boundsIntersections.length + intersections.length === 2) {
                    const x = [...intersections, ...boundsIntersections];
                    createEdge(x[0], x[1]);

                }
                drawDebug([site, cell.site], [], [cell]);
                //debugger;
            }

            edgesToRemove.forEach((edge: Segment) => {
                //edges.removeWhere(o => o.isEqualTo(edge));
                cell.edges.removeWhere(o => o.isEqualTo(edge));
            });
            drawDebug([site, cell.site], [], [cell]);
            //debugger;
        });
        cells.push(siteCell);
    });

    const edges = cells.map(cell => cell.edges).flattened().distinct(edge => edge.hash)

    // clear();
    // edges.forEach(edge => drawEdge(edge, false));
    // debugger;

    // clear();
    // cells.forEach(cell => drawCell(cell, false));
    // debugger;

    const points = [...boundsCorners];
    outerBoundsSegments.forEach((segment: { a: Point, b: Point }) => {

    })

    return { edges, cells };
}