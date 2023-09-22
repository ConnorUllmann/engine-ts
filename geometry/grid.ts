import { repeat } from '../core/utils';
import { IdSet } from '../tools/id-set';
import { Stack } from '../tools/stack';
import { CompassDirection, CompassDirectionGroup, CompassDirectionsByGroup, PointByCompassDirection } from './compass';
import { IPoint } from './interfaces';

export interface IGrid<T> {
  w: number;
  h: number;
  set: (position: IPoint, tile: T) => void;
  get: (position: IPoint) => T | null;
}

export class GridView<T> implements IGrid<T> {
  public readonly w: number;
  public readonly h: number;
  constructor(public readonly tiles: T[][]) {
    this.h = this.tiles.length;
    this.w = this.tiles.first()?.length ?? 0;
  }

  public set(position: IPoint, tile: T): void {
    if (Grid.IsInside(this, position)) this.tiles[position.y][position.x] = tile;
  }

  public get(position: IPoint): T | null {
    return Grid.IsInside(this, position) ? this.tiles[position.y][position.x] : null;
  }
}

export class Grid<T> extends GridView<T> implements IGrid<T> {
  public static IsInside<T>(grid: IGrid<T>, { x, y }: IPoint): boolean {
    return y >= 0 && y < grid.h && x >= 0 && x < grid.w;
  }

  public static GetNeighbors<T>(
    grid: IGrid<T>,
    position: IPoint,
    relativePoints: IPoint[]
  ): { position: IPoint; tile: T | null }[] {
    return relativePoints.map(o => {
      const positionTemp = { x: position.x + o.x, y: position.y + o.y };
      return { position: positionTemp, tile: grid.get(positionTemp) };
    });
  }

  public static GetCompassDirectionNeighbors<T>(
    grid: IGrid<T>,
    position: IPoint,
    compassDirections: readonly CompassDirection[]
  ): { position: IPoint; tile: T | null }[] {
    const compassDirectionPoints = compassDirections.map(direction => PointByCompassDirection[direction]);
    return Grid.GetNeighbors(grid, position, compassDirectionPoints);
  }

  public static GetCompassDirectionGroupNeighbors<T>(
    grid: IGrid<T>,
    position: IPoint,
    group: CompassDirectionGroup
  ): { position: IPoint; tile: T | null }[] {
    const compassDirections = CompassDirectionsByGroup[group];
    return Grid.GetCompassDirectionNeighbors(grid, position, compassDirections);
  }

  // https://lodev.org/cgtutor/floodfill.html
  public static GetRegion<T>(
    grid: IGrid<T>,
    position: IPoint,
    getValue: (t: T) => any
  ): IdSet<{ x: number; y: number; tile: T }> {
    const temp = { x: 0, y: 0 };
    return this.GetRegionByPosition(grid, position, (x, y) => {
      temp.x = x;
      temp.y = y;
      return getValue(grid.get(temp)!);
    });
  }

  public static GetRegionByPosition<T>(
    grid: IGrid<T>,
    position: IPoint,
    getValue: (x: number, y: number) => any
  ): IdSet<{ x: number; y: number; tile: T }> {
    const result = new IdSet<{ x: number; y: number; tile: T }>((o: IPoint) => o.y * grid.w + o.x);
    for (let o of this.GetRegionGeneric(grid.w, grid.h, position, getValue)) {
      result.add({
        x: o.x,
        y: o.y,
        tile: grid.get(o)!,
      });
    }
    return result;
  }

  public static GetRegionGeneric(
    w: number,
    h: number,
    position: IPoint,
    getValue: (x: number, y: number) => any
  ): IdSet<IPoint> {
    let oldValue = getValue(position.x, position.y);
    let region = new IdSet((o: IPoint) => o.y * w + o.x);
    if (position.x < 0 || position.x >= w || position.y < 0 || position.y >= h) return region;

    let y1 = 0;
    let spanAbove = false;
    let spanBelow = false;

    let stack = new Stack<IPoint>();
    stack.push(position);
    while (true) {
      const pt = stack.pop();
      if (pt == null) break;
      const { x, y } = pt;

      y1 = y;
      while (y1 >= 0 && getValue(x, y1) === oldValue) y1--;
      y1++;

      spanAbove = false;
      spanBelow = false;
      while (y1 < h && getValue(x, y1) === oldValue) {
        const obj = { x, y: y1 };
        if (region.has(obj)) break;
        region.add(obj);
        if (!spanAbove && x > 0 && getValue(x - 1, y1) === oldValue) {
          stack.push({ x: x - 1, y: y1 });
          spanAbove = true;
        } else if (spanAbove && x > 0 && getValue(x - 1, y1) !== oldValue) {
          spanAbove = false;
        }
        if (!spanBelow && x < w - 1 && getValue(x + 1, y1) === oldValue) {
          stack.push({ y: y1, x: x + 1 });
          spanBelow = true;
        } else if (spanBelow && x < w - 1 && getValue(x + 1, y1) !== oldValue) {
          spanBelow = false;
        }
        y1++;
      }
    }
    return region;
  }

  public static SetEach<T>(grid: IGrid<T>, tileGetter: (position: IPoint) => T): void {
    const position = { x: 0, y: 0 };
    for (position.y = 0; position.y < grid.h; position.y++)
      for (position.x = 0; position.x < grid.w; position.x++) {
        grid.set(position, tileGetter(position));
      }
  }

  public static ForEach<T>(grid: IGrid<T>, tileCall: (tile: T, position: IPoint) => void): void {
    const position = { x: 0, y: 0 };
    for (position.y = 0; position.y < grid.h; position.y++)
      for (position.x = 0; position.x < grid.w; position.x++) {
        const tile = grid.get(position);
        if (tile !== null) tileCall(tile, position);
      }
  }

  public static Map<T, U>(grid: IGrid<T>, valueGetter: (tile: T, position: IPoint) => U): U[] {
    const results: U[] = [];
    const position = { x: 0, y: 0 };
    for (position.y = 0; position.y < grid.h; position.y++)
      for (position.x = 0; position.x < grid.w; position.x++) {
        const tile = grid.get(position);
        if (tile != null) results.push(valueGetter(tile, position));
      }
    return results;
  }

  constructor(w: number, h: number, tileGetter: (position: IPoint) => T) {
    super(
      (() => {
        const temp = { x: 0, y: 0 };
        return repeat(Math.ceil(h), y =>
          repeat(Math.ceil(w), x => {
            temp.x = x;
            temp.y = y;
            return tileGetter(temp);
          })
        );
      })()
    );
  }
}
