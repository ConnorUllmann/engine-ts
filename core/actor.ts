import { Entity } from './entity';
import { World } from './world';
import { IRectangle } from '@engine-ts/geometry/interfaces';
import { Point } from '@engine-ts/geometry/point';

export class Actor extends Entity {
    public readonly boundsOffset: Point = new Point(0, 0);
    public get bounds(): IRectangle {
        return { 
            x: this.position.x + this.boundsOffset.x - this.w/2,
            y: this.position.y + this.boundsOffset.y - this.h/2,
            w: this.w,
            h: this.h
        };
    }

    public friction: number = 0.01;
    public readonly velocity: Point = new Point();
    public readonly acceleration: Point = new Point();

    constructor(world: World, x: number, y: number, public w: number, public h: number) {
        super(world, x, y);
    }

    update() {
        this.velocity
            .add(this.acceleration.clone.scale(this.world.deltaNormal))
            .scale(1 - this.friction);
        
        this.position
            .add(this.velocity);
    }
}