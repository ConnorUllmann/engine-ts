import { Entity } from './entity';
import { World } from './world';
import { IRectangle, IPoint } from '@engine-ts/geometry/interfaces';
import { Point } from '@engine-ts/geometry/point';
import { Collider } from './collider';
import { BoundableShape } from '@engine-ts/geometry/geometry';

export class Actor extends Entity {
    public readonly collider: Collider<any>;
    public get bounds(): Readonly<IRectangle> { return this.collider.bounds; }

    public get w(): number { return this.collider.w; };
    public get h(): number { return this.collider.h; }
    public get xLeft(): number { return this.collider.xLeft; }
    public get xCenter(): number { return this.collider.xCenter; }
    public get xRight(): number { return this.collider.xRight; }
    public get yTop(): number { return this.collider.yTop; }
    public get yCenter(): number { return this.collider.yCenter; }
    public get yBottom(): number { return this.collider.yBottom }

    public friction: number = 0.01;
    public readonly velocity: Point = new Point();
    public readonly acceleration: Point = new Point();

    constructor(world: World, position: IPoint, shape: BoundableShape, mask: number) {
        super(world, position);
        this.collider = new Collider(this, mask, shape);
        this.addComponent(this.collider);
    }

    update() {
        this.updatePhysics();
    }

    protected updateVelocity() {
        this.velocity
            .add(this.frameAcceleration)
            .scale(1 - this.friction);
    }

    protected updatePosition() {
        this.position
            .add(this.frameVelocity);
    }

    protected updatePhysics() {
        this.updateVelocity();
        this.updatePosition();
    }

    private _frameVelocity: Point = new Point();
    get frameVelocity(): IPoint {
        const deltaNormal = this.world.deltaNormal;
        return this._frameVelocity.setToXY(
            this.velocity.x * deltaNormal,
            this.velocity.y * deltaNormal
        );
    }

    private _frameAcceleration: Point = new Point();
    get frameAcceleration(): IPoint {
        const deltaNormal = this.world.deltaNormal;
        return this._frameAcceleration.setToXY(
            this.acceleration.x * deltaNormal,
            this.acceleration.y * deltaNormal
        );
    }

    public collide(collider: Collider<any>, xOffset: number=0, yOffset: number=0): boolean {
        return this.collider.collideCollider(collider, xOffset, yOffset);
    }
}