import { Entity } from "@engine-ts/core/entity";
import { Geometry, BoundableShape } from "@engine-ts/geometry/geometry";
import { IRectangle } from "@engine-ts/geometry/interfaces";
import { Rectangle } from "@engine-ts/geometry/rectangle";
import { Component } from "./component";

export class Collider extends Component implements Readonly<IRectangle> {
    private readonly _boundsLocal: IRectangle;
    private readonly _bounds: Rectangle;

    constructor(
        entity: Entity,
        public mask: number,
        private readonly shape?: BoundableShape
    ) {
        super(entity);
        this._boundsLocal = Geometry.Bounds(shape);
        this._bounds = new Rectangle();
    }

    public get boundsLocal(): Readonly<IRectangle> | null {
        return this._boundsLocal;
    }

    public get bounds(): Readonly<IRectangle> | null {
        this._bounds.x = this._boundsLocal.x + this.entity.position.x;
        this._bounds.y = this._boundsLocal.y + this.entity.position.y;
        this._bounds.w = this._boundsLocal.w;
        this._bounds.h = this._boundsLocal.h;
        return this._bounds;
    }

    public firstCollision(mask: number): Collider | null {
        return this.entity.world.firstComponentOfClass(
            Collider,
            collider => collider != this && (collider.mask & mask) == mask && this.collideBounds(collider) && this.collideShape(collider)
        );
    }

    public firstShapeCollision(mask: number): Collider | null {
        return this.entity.world.firstComponentOfClass(
            Collider,
            collider => collider != this && (collider.mask & mask) == mask && this.collideShape(collider)
        );
    }

    public firstBoundsCollision(mask: number, xOffset: number=0, yOffset: number=0): Collider | null {
        return this.entity.world.firstComponentOfClass(
            Collider,
            collider => collider != this && (collider.mask & mask) == mask && this.collideBounds(collider, xOffset, yOffset)
        );
    }

    public allShapeCollisions(mask: number): Collider[] {
        const results = [];
        this.entity.world.forEachComponentOfClass(
            Collider,
            collider => {
                if(collider != this && (collider.mask & mask) == mask && this.collideShape(collider))
                    results.push(collider);
            }
        );
        return results;
    }

    public allBoundsCollisions(mask: number, xOffset: number=0, yOffset: number=0): Collider[] {
        const results = [];
        this.entity.world.forEachComponentOfClass(
            Collider,
            collider => {
                if(collider != this && (collider.mask & mask) == mask && this.collideBounds(collider, xOffset, yOffset))
                    results.push(collider);
            }
        );
        return results;
    }

    public collideBoundsMask(mask: number, xOffset: number=0, yOffset: number=0): boolean {
        return this.firstBoundsCollision(mask, xOffset, yOffset) != null;
    }

    public collideCollider(collider: Collider): boolean {
        if(collider == this || !this.active || !collider.active || !this.entity.active || !collider.entity.active)
            return false;
        if(!this.collideBounds(collider))
            return false;
        return this.collideShape(collider);
    }

    public collideBounds(collider: Collider, xOffset: number=0, yOffset: number=0): boolean {
        const rectangleAx = this._boundsLocal.x + this.entity.position.x + xOffset;
        const rectangleAy = this._boundsLocal.y + this.entity.position.y + yOffset;
        const rectangleAw = this._boundsLocal.w;
        const rectangleAh = this._boundsLocal.h;
        const rectangleBx = collider._boundsLocal.x + collider.entity.position.x;
        const rectangleBy = collider._boundsLocal.y + collider.entity.position.y;
        const rectangleBw = collider._boundsLocal.w;
        const rectangleBh = collider._boundsLocal.h;
        return rectangleAx + rectangleAw > rectangleBx 
            && rectangleAy + rectangleAh > rectangleBy 
            && rectangleAx < rectangleBx + rectangleBw 
            && rectangleAy < rectangleBy + rectangleBh;
    }

    public collideShape(collider: Collider): boolean {
        return Geometry.Collide.AnyAny(this.shape, collider.shape);
    }

    public get w(): number { return this._boundsLocal.w; };
    public set w(w: number) { this._boundsLocal.w = w; }
    public get h(): number { return this._boundsLocal.h; }
    public set h(h: number) { this._boundsLocal.h = h; }
    public get x(): number { return this._boundsLocal.x + this.entity.position.x; }
    public get y(): number { return this._boundsLocal.y + this.entity.position.y; }
    public get xLeft(): number { return this._boundsLocal.x + this.entity.position.x; }
    public get xCenter(): number { return this.xLeft + this.w/2; }
    public get xRight(): number { return this._boundsLocal.x + this._boundsLocal.w + this.entity.position.x; }
    public get yTop(): number { return this._boundsLocal.y + this.entity.position.y; }
    public get yCenter(): number { return this.yTop + this.h/2; }
    public get yBottom(): number { return this._boundsLocal.y + this._boundsLocal.h + this.entity.position.y; }
}