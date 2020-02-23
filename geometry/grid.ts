import { Point } from './point';

export class Grid<T> {
    private tiles: T[][];

    constructor(public readonly rows: number, public readonly columns: number, private tileGetter: (i: number, j: number) => T) {
        this.rows = Math.ceil(this.rows);
        this.columns = Math.ceil(this.columns);
        this.reset();
    }

    public reset(): void {
        this.tiles = [];
        for(let i = 0; i < this.rows; i++) {
            const row = [];
            for(let j = 0; j < this.columns; j++)
                row.push(this.tileGetter(i, j));
            this.tiles.push(row);
        }
    }

    private indicesInside(i: number, j: number): boolean {
        return i >= 0 && i < this.rows && j >= 0 && j < this.columns;
    }

    public set(i: number, j: number, tile: T): void {
        if(!this.indicesInside(i, j))
            return;
        this.tiles[i][j] = tile;
    }

    public get(i: number, j: number): T {
        return this.indicesInside(i, j) ? this.tiles[i][j] : null;
    }

    private static CardinalNeighborsRelativeIndexMap: Point[] = [
        Point.up,
        Point.right,
        Point.down,
        Point.left
    ];
    public getCardinalNeighbors(i: number, j: number): T[] {
        return Grid.CardinalNeighborsRelativeIndexMap
            .map(o => this.get(i + o.x, j + o.y))
            .filter(o => o != null);
    };

    public map(valueGetter: (tile: T, i?: number, j?: number) => any): any[] {
        const results = [];
        for(let i = 0; i < this.rows; i++)
        for(let j = 0; j < this.columns; j++)
            results.push(valueGetter(this.get(i, j), i, j));
        return results;
    };

    public forEach(tileCall: (tile: T, i?: number, j?: number) => void): void {
        for(let i = 0; i < this.rows; i++)
        for(let j = 0; j < this.columns; j++)
        {
            const tile = this.get(i, j);
            if(tile !== null)
                tileCall(tile, i, j);
        }
    };

    public setEach(tileGetter: (i: number, j: number) => T): void {
        for(let i = 0; i < this.rows; i++)
        for(let j = 0; j < this.columns; j++)
            this.set(i, j, tileGetter(i, j));
    };
}