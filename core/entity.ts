import { World } from './world';
import { Point } from '@engine-ts/geometry/point';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { Geometry } from '@engine-ts/geometry/geometry';

export class Entity {
    public readonly id: number;
    // rename to "species" or "breed" or something?
    public get class(): string { return this.constructor.name; }
    public static get Class(): string { return this.name; }

    public destroyed: boolean = false;
    public removed: boolean = false;
    public active: boolean = true;
    public visible: boolean = true;
    public depth: number = 0;

    public readonly position: Point = new Point();

    constructor(public readonly world: World, position: IPoint=Geometry.Point.Zero) {
        this.id = this.world.addEntity(this);
        this.position.x = position.x;
        this.position.y = position.y;
    }

    public toString(): string { 
        return JSON.stringify({ 
            class: this.class, 
            id: this.id, 
            position: this.position.toString()
        })
    }

    // sets this entity up to be removed from the World the next time
    // entities have finished updating but haven't yet drawn to the screen
    public destroy(): void {
        this.world.destroyEntity(this);
    }


    /* Handlers */

    // called by World when entity is removed from the world
    public remove(): void {}

    // called by World each frame
    public update(): void {}

    // called by World each frame after all entities have had their .update() called
    public postUpdate(): void {}

    // called by World each frame after all updates and after removing all destroyed entities
    public draw(): void {}
}