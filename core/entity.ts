import { World } from './world';
import { Point } from '@engine-ts/geometry/point';

export class Entity {
    public id: number | null = null;
    public get class(): string { return this.constructor.name; }
    public destroyed: boolean = false;
    public active: boolean = true;
    public visible: boolean = true;
    public depth: number = 0;

    public readonly position: Point = new Point();

    constructor(public readonly world: World, x: number=0, y: number = 0) {
        this.world.addEntity(this);
        this.position.x = x;
        this.position.y = y;
    }

    public destroy(): void { this.world.destroyEntity(this); }

    public toString(): string { 
        return JSON.stringify({ 
            class: this.class, 
            id: this.id, 
            position: this.position.toString()
        })
    }

    public removed(): void {}
    public update(): void {}
    public postUpdate(): void {}
    public render(): void {}
}