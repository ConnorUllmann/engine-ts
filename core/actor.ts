import { Entity } from './entity';
import { World } from './world';
import { IRectangle, IPoint } from '../geometry/interfaces';
import { Point } from '../geometry/point';
import { Collider } from './collider';
import { BoundableShape } from '../geometry/geometry';

export class Actor extends Entity {
    public readonly collider: Collider<any>;
    public get bounds(): Readonly<IRectangle> { return this.collider.bounds; }
    public get boundsLocal(): Readonly<IRectangle> { return this.collider.boundsLocal; }

    public get w(): number { return this.collider.w; };
    public get h(): number { return this.collider.h; }
    public get xLeft(): number { return this.collider.xLeft; }
    public set xLeft(x: number) { this.position.x = x - this.boundsLocal.x }
    public get xCenter(): number { return this.collider.xCenter; }
    public set xCenter(x: number) { this.position.x = x - this.boundsLocal.w/2 - this.boundsLocal.x }
    public get xRight(): number { return this.collider.xRight; }
    public set xRight(x: number) { this.position.x = x - this.boundsLocal.w - this.boundsLocal.x }
    public get yTop(): number { return this.collider.yTop; }
    public set yTop(y: number) { this.position.y = y - this.boundsLocal.y }
    public get yCenter(): number { return this.collider.yCenter; }
    public set yCenter(y: number) { this.position.y = y - this.boundsLocal.h/2 - this.boundsLocal.y }
    public get yBottom(): number { return this.collider.yBottom }
    public set yBottom(y: number) { this.position.y = y - this.boundsLocal.h - this.boundsLocal.y }

    public friction: number = 0.01;
    public readonly velocity: Point = new Point();
    public readonly acceleration: Point = new Point();

    public positionPrevious = { x: 0, y: 0 };

    constructor(world: World, position: IPoint, shape: BoundableShape, mask: number) {
        super(world, position);
        this.collider = new Collider(mask, shape);
        this.addComponent(this.collider);

        this.positionPrevious.x = this.position.x;
        this.positionPrevious.y = this.position.y;
    }

    update() {
        this.updatePhysics();
    }

    protected updateVelocity() {
        this.velocity
            .add(this.frameAcceleration)
            .scale(1 - this.friction);
    }

    protected updatePreviousPosition() {
        this.positionPrevious.x = this.position.x;
        this.positionPrevious.y = this.position.y;
    }

    protected updatePosition() {
        this.position
            .add(this.frameVelocity);
    }

    protected updatePhysics() {
        this.updateVelocity();
        this.updatePreviousPosition();
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
        return this.collider.collideCollider(collider, xOffset, yOffset) != null;
    }
}