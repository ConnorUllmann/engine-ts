import { World } from './world';
import { Point } from '@engine-ts/geometry/point';
import { IPoint } from '@engine-ts/geometry/interfaces';

export class Entity {
    public id: number | null = null;
    // rename to "species" or "breed" or something?
    public get class(): string { return this.constructor.name; }
    public destroyed: boolean = false;
    public removed: boolean = false;
    public active: boolean = true;
    public visible: boolean = true;
    public depth: number = 0;

    public readonly position: Point = new Point();

    constructor(public readonly world: World, position: IPoint={x: 0, y: 0}) {
        this.world.addEntity(this);
        this.position.x = position.x;
        this.position.y = position.y;
    }

    public destroy(): void {
        this.world.destroyEntity(this);
    }

    public toString(): string { 
        return JSON.stringify({ 
            class: this.class, 
            id: this.id, 
            position: this.position.toString()
        })
    }
    
    public update(): void {}
    public postUpdate(): void {}
    public render(): void {}
}