import { Entity } from './entity';
import { World } from './world';
import { IRectangle } from '@engine-ts/geometry/interfaces';
import { Point } from '@engine-ts/geometry/point';
import { Geometry } from '@engine-ts/geometry/geometry';

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

    public w: number;
    public h: number;

    public friction: number = 0.01;
    public readonly velocity: Point = new Point();
    public readonly acceleration: Point = new Point();

    constructor(world: World, rectangle: IRectangle) {
        super(world, rectangle);
        this.w = rectangle.w;
        this.h = rectangle.h;
    }

    update() {
        this.updateVelocity();
        this.updatePosition();
    }

    protected updateVelocity() {
        this.velocity
            .add(this.acceleration.clone.scale(this.world.deltaNormal))
            .scale(1 - this.friction);
    }

    protected updatePosition() {
        this.position
            .add(this.velocity.clone.scale(this.world.deltaNormal));
    }
}