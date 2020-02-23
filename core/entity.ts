import { World } from './world';
import { Point } from '../geometry/point';

export class Entity extends Point {
    public world: World;
    public id: number | null = null;
    public get class(): string { return this.constructor.name; }
    public destroyed: boolean = false;
    public active: boolean = true;
    public visible: boolean = true;
    public depth: number = 0;

    constructor(world: World, x: number=0, y: number = 0) {
        super(x, y);
        world.addEntity(this);
    }

    public destroy(): void { this.world.destroyEntity(this); }

    public toString(): string { 
        return JSON.stringify({ 
            class: this.class, 
            id: this.id, 
            x: this.x.toFixed(1), 
            y: this.y.toFixed(1) 
        })
    }

    public added(): void {}
    public removed(): void {}
    public update(): void {}
    public postUpdate(): void {}
    public render(): void {}
}