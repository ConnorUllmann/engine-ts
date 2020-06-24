import { IGrid, Grid } from "@engine-ts/geometry/grid";
import { IPoint } from '@engine-ts/geometry/interfaces';
import { CompassDirectionGroup } from '@engine-ts/geometry/compass';
import { Geometry } from '@engine-ts/geometry/geometry';
import { Heap } from './heap';
import { clamp } from '@engine-ts/core/utils';

export class PathMap<T> {
    private readonly gridPath: IGrid<PathTile<T>>;
    private readonly neighborsCallback: (position: IPoint) => (PathTile<T> | null)[];

    constructor(private readonly grid: IGrid<T>, private readonly getSolid: (obj: T) => boolean, canMoveDiagonally=false)
    {
        this.gridPath = new Grid<PathTile<T>>(this.grid.w, this.grid.h, (position: IPoint) => new PathTile(this.grid, position));
        const compassDirectionGroup = canMoveDiagonally ? CompassDirectionGroup.ALL : CompassDirectionGroup.CARDINAL;
        this.neighborsCallback = (position: IPoint) => this.gridPath.getCompassDirectionGroupNeighbors(position, compassDirectionGroup);
    }

    public reset() {
        this.gridPath.forEach(o => o.reset());
    };

    public distance(tile0: PathTile<T>, tile1: PathTile<T>): number {
        return Geometry.Point.Distance(tile0.position, tile1.position);
    };

    public findPath(start: IPoint, target: IPoint, useClosestNonSolidTileIfTargetIsSolid: boolean=true): { position: IPoint, tile: T }[] {
        this.reset();

        let open = new Heap<PathTile<T>>((a, b) => a.compare(b));
        let closed = [];
        let path = [];

        let last = this.gridPath.get({
            x: clamp(start.x, 0, this.gridPath.w-1),
            y: clamp(start.y, 0, this.gridPath.h-1)
        });
        if(this.getSolid(last.gridObject))
            return [];

        let first = this.gridPath.get({
            x: clamp(target.x, 0, this.gridPath.w-1),
            y: clamp(target.y, 0, this.gridPath.h-1)
        });
        if(this.getSolid(first.gridObject)) {
            if (!useClosestNonSolidTileIfTargetIsSolid)
                return [];
            // find the tile in the region I have access to which is closest to the target and find a path to it instead
            first = Grid.GetRegion(this.gridPath, start, o => !this.getSolid(o.gridObject))
                .minOf(o => Geometry.Point.DistanceSq(o.position, target));
            if(first === null)
                return [];
            return this.findPath(start, first.position, useClosestNonSolidTileIfTargetIsSolid);
        }

        first.setHeuristicProperties(0, this.distance(first, last));
        open.add(first);

        let current: PathTile<T> | null = null;
        while(!open.isEmpty())
        {
            current = open.pop();
            closed.push(current);

            if(current === last)
            {
                current.reset();
                while(true) // some say I'm bold
                {
                    path.push(current);
                    let neighborsBacktrack = this.neighborsCallback(current.position);
                    for(let neighbor of neighborsBacktrack)
                        if(neighbor != null && neighbor.steps != null && (current.steps == null || neighbor.steps < current.steps))
                            current = neighbor;
                    if(current === first)
                    {
                        path.push(current);
                        return path.map(o => ({ position: o.position, tile: o.gridObject }));
                    }
                }
            }
            const neighbors = this.neighborsCallback(current.position);
            for(let neighbor of neighbors)
            {
                if(neighbor == null || this.getSolid(neighbor.gridObject) || closed.includes(neighbor))
                    continue;

                const neighborSteps = current.steps + this.distance(current, neighbor);
                const neighborTargetDistance = this.distance(neighbor, last);
                if(open.contains(neighbor))
                {
                    const neighborHeuristic = PathTile.Heuristic(neighborSteps, neighborTargetDistance);
                    if(neighborHeuristic < PathTile.Heuristic(neighbor.steps, neighbor.targetDistance))
                        neighbor.setHeuristicProperties(neighborSteps, neighborTargetDistance);
                }
                else
                {
                    neighbor.setHeuristicProperties(neighborSteps, neighborTargetDistance);
                    open.add(neighbor);
                }
            }
        }
        return [];
    };
}


class PathTile<T> {
    public gridObject: T;
    public steps: number | null = null;
    public targetDistance: number | null = null;

    constructor(private readonly grid: IGrid<T>, public readonly position: IPoint) {
        this.gridObject = this.grid.get(this.position);
        this.reset();
    }
    
    public reset(): void {
        this.setHeuristicProperties(null, null);
    };
    
    public compare(other: PathTile<T>): number {
        if(other == null)
            return 0;
        let diff = PathTile.Heuristic(this.steps, this.targetDistance) - PathTile.Heuristic(other.steps, other.targetDistance);
        return Math.sign(diff);
    };
    
    public setHeuristicProperties(steps: number | null, targetDistance: number | null): void {
        this.steps = steps;
        this.targetDistance = targetDistance;
    };
    
    public static Heuristic(steps: number | null, targetDistance: number | null): number {
        if(steps == null || targetDistance == null)
            return Number.MAX_SAFE_INTEGER;
        return steps + targetDistance; //Square targetDistance to prefer travelling diagonally even if we only look ats cardinal neighbors
    };    
}