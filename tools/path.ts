import { IGrid, Grid } from '../geometry/grid';
import { IPoint } from '../geometry/interfaces';
import { CompassDirectionGroup } from '../geometry/compass';
import { Geometry } from '../geometry/geometry';
import { Heap } from './heap';
import { clamp, DeepReadonly } from '../core/utils';

export class PathMap<T> {
  private readonly gridPath: IGrid<PathTile<T>>;
  private readonly neighborsCallback: (position: IPoint) => (PathTile<T> | null)[];

  constructor(
    private readonly grid: IGrid<T>,
    private readonly getSolid: (tile: T, position: Readonly<IPoint>) => boolean,
    canMoveDiagonally = false
  ) {
    this.gridPath = new Grid<PathTile<T>>(
      this.grid.w,
      this.grid.h,
      (position: IPoint) => new PathTile(this.grid, position)
    );
    const compassDirectionGroup = canMoveDiagonally ? CompassDirectionGroup.ALL : CompassDirectionGroup.CARDINAL;
    this.neighborsCallback = (position: IPoint) =>
      Grid.GetCompassDirectionGroupNeighbors(this.gridPath, position, compassDirectionGroup).map(o => o.tile);
  }

  public reset() {
    this.refreshTileReferences();
    this.resetHeuristics();
  }

  // call when references to the tiles that make up the grid we are pathfinding on are updated
  // (basically, any time .set() is called on the grid that was passed into this object)
  public refreshTileReferences() {
    Grid.ForEach(this.gridPath, o => o.refreshTileReference());
  }

  private resetHeuristics() {
    Grid.ForEach(this.gridPath, o => o.resetHeuristics());
  }

  private distance(tile0: PathTile<T>, tile1: PathTile<T>): number {
    return Geometry.Point.Distance(tile0.position, tile1.position);
  }

  public findPath(
    start: IPoint,
    target: IPoint,
    useClosestNonSolidTileIfTargetIsSolid: boolean = true
  ): { position: IPoint; tile: T }[] {
    this.resetHeuristics();

    let open = new Heap<PathTile<T>>((a, b) => a.compare(b));
    let closed = new Set();
    let path: PathTile<T>[] = [];

    let last = this.gridPath.get({
      x: clamp(start.x, 0, this.gridPath.w - 1),
      y: clamp(start.y, 0, this.gridPath.h - 1),
    });
    if (!last || this.getSolid(last.tile, last.position)) return [];

    let first = this.gridPath.get({
      x: clamp(target.x, 0, this.gridPath.w - 1),
      y: clamp(target.y, 0, this.gridPath.h - 1),
    });
    if (!first || this.getSolid(first.tile, first.position)) {
      if (!useClosestNonSolidTileIfTargetIsSolid) return [];
      // find the tile in the region I have access to which is closest to the target and find a path to it instead
      const region = Grid.GetRegion(this.gridPath, start, o => !this.getSolid(o.tile, o.position));
      let minDistanceSq: number | null = null;
      let minRegionTile: { x: number; y: number; tile: PathTile<T> } | null = null;
      for (let regionTile of region) {
        const distanceSq = Geometry.Point.DistanceSq(regionTile.tile.position, target);
        if (minDistanceSq == null || distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          minRegionTile = regionTile;
        }
      }
      return minRegionTile?.tile == null
        ? []
        : this.findPath(start, minRegionTile.tile.position, useClosestNonSolidTileIfTargetIsSolid);
    }

    first.setHeuristicProperties(0, this.distance(first, last));
    open.add(first);

    let current: PathTile<T>;
    while (!open.isEmpty()) {
      current = open.pop()!;
      closed.add(current.hash);

      if (current === last) {
        current.resetHeuristics();
        while (true) {
          // some say I'm bold
          path.push(current);
          const neighborsBacktrack = this.neighborsCallback(current.position);
          for (const neighbor of neighborsBacktrack)
            if (neighbor != null && neighbor.steps != null && (current.steps == null || neighbor.steps < current.steps))
              current = neighbor;
          if (current === first) {
            path.push(current);
            return path.map(o => ({ position: o.position, tile: o.tile }));
          }
        }
      }
      const neighbors = this.neighborsCallback(current.position);
      for (const neighbor of neighbors) {
        if (neighbor == null || closed.has(neighbor.hash) || this.getSolid(neighbor.tile, neighbor.position)) continue;

        const neighborSteps = (current.steps ?? 0) + this.distance(current, neighbor);
        const neighborTargetDistance = this.distance(neighbor, last);
        if (open.contains(neighbor)) {
          const neighborHeuristic = PathTile.Heuristic(neighborSteps, neighborTargetDistance);
          if (neighborHeuristic < PathTile.Heuristic(neighbor.steps, neighbor.targetDistance))
            neighbor.setHeuristicProperties(neighborSteps, neighborTargetDistance);
        } else {
          neighbor.setHeuristicProperties(neighborSteps, neighborTargetDistance);
          open.add(neighbor);
        }
      }
    }
    return [];
  }
}

class PathTile<T> {
  public tile: T = undefined as T;
  public steps: number | null = null;
  public targetDistance: number | null = null;
  public readonly hash: number;
  public readonly position: DeepReadonly<IPoint>;

  // position must be inside the grid
  constructor(private readonly grid: IGrid<T>, position: DeepReadonly<IPoint>) {
    this.position = { x: position.x, y: position.y };
    this.hash = this.position.x + this.position.y * this.grid.w;
    this.refreshTileReference();
    this.resetHeuristics();
  }

  public refreshTileReference() {
    this.tile = this.grid.get(this.position)!;
    this.resetHeuristics();
  }

  public resetHeuristics(): void {
    this.setHeuristicProperties(null, null);
  }

  public compare(other: PathTile<T>): number {
    if (other == null) return 0;
    let diff =
      PathTile.Heuristic(this.steps, this.targetDistance) - PathTile.Heuristic(other.steps, other.targetDistance);
    return Math.sign(diff);
  }

  public setHeuristicProperties(steps: number | null, targetDistance: number | null): void {
    this.steps = steps;
    this.targetDistance = targetDistance;
  }

  public static Heuristic(steps: number | null, targetDistance: number | null): number {
    if (steps == null || targetDistance == null) return Number.MAX_SAFE_INTEGER;
    return steps + targetDistance; //Square targetDistance to prefer travelling diagonally even if we only look at cardinal neighbors
  }
}
