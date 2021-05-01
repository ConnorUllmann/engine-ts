import { Geometry, BoundableShape } from "@engine-ts/geometry/geometry";
import { IRectangle } from "@engine-ts/geometry/interfaces";
import { Rectangle } from "@engine-ts/geometry/rectangle";
import { Component } from "./component";
import { DeepReadonly } from "./utils";

// TODO: add "shape" property which translates shapeLocal to the position of the entity
export class Collider<T extends BoundableShape> extends Component implements Readonly<IRectangle> {
    private readonly _boundsLocal: IRectangle;
    private readonly _bounds: Rectangle;

    constructor(
        public mask: number,
        private readonly _shapeLocal: T
    ) {
        super();
        this._boundsLocal = Geometry.Bounds(_shapeLocal);
        this._bounds = new Rectangle();
    }

    public get shapeLocal(): DeepReadonly<T> {
        return this._shapeLocal;
    }

    public get boundsLocal(): Readonly<IRectangle> {
        return this._boundsLocal;
    }

    public get bounds(): Readonly<IRectangle> {
        this._bounds.x = this._boundsLocal.x + (this.entity?.position.x ?? 0);
        this._bounds.y = this._boundsLocal.y + (this.entity?.position.y ?? 0);
        this._bounds.w = this._boundsLocal.w;
        this._bounds.h = this._boundsLocal.h;
        return this._bounds;
    }

    public firstBoundsCollision(mask: number, xOffset: number=0, yOffset: number=0): Collider<BoundableShape> | null {
        return this.entity == null ? null : this.entity.world.firstComponentOfClass(
            Collider,
            collider => collider != this && (collider.mask & mask) == mask && this.collideBounds(collider, xOffset, yOffset)
        );
    }

    public firstCollision(mask: number, xOffset: number=0, yOffset: number=0): Collider<BoundableShape> | null {
        return this.entity == null ? null : this.entity.world.firstComponentOfClass(
            Collider,
            collider => collider != this && (collider.mask & mask) == mask && this.collideBounds(collider, xOffset, yOffset) && this.collideShape(collider, xOffset, yOffset) != null
        );
    }

    public allBoundsCollisions(mask: number, xOffset: number=0, yOffset: number=0): Collider<BoundableShape>[] {
        if(!this.entity)
            return [];
        const results: Collider<BoundableShape>[] = [];
        this.entity.world.forEachComponentOfClass(
            Collider,
            collider => {
                if(collider != this && (collider.mask & mask) == mask && this.collideBounds(collider, xOffset, yOffset))
                    results.push(collider);
            }
        );
        return results;
    }

    public allCollisions(mask: number, xOffset: number=0, yOffset: number=0): Collider<BoundableShape>[] {
        if(!this.entity)
            return [];
        const results: Collider<BoundableShape>[] = [];
        this.entity.world.forEachComponentOfClass(
            Collider,
            collider => {
                if(collider != this && (collider.mask & mask) == mask && this.collideBounds(collider, xOffset, yOffset) && this.collideShape(collider, xOffset, yOffset))
                    results.push(collider);
            }
        );
        return results;
    }

    public collideBoundsMask(mask: number, xOffset: number=0, yOffset: number=0): boolean {
        return this.firstBoundsCollision(mask, xOffset, yOffset) != null;
    }

    public collideMask(mask: number, xOffset: number=0, yOffset: number=0): boolean {
        return this.firstCollision(mask, xOffset, yOffset) != null;
    }

    // any inactive colliders/entities will result in false
    public collideCollider<U extends BoundableShape>(collider: Collider<U>, xOffset: number=0, yOffset: number=0): Collider<U> | null {
        if((collider as unknown as Collider<T>) == this || !this.active || !collider.active || !this.entity || !collider.entity || !this.entity.active || !collider.entity.active)
            return null;
        if(!this.collideBounds(collider, xOffset, yOffset))
            return null;
        return this.collideShape(collider, xOffset, yOffset);
    }

    // does not consider active/inactive status
    public collideBounds(collider: Collider<BoundableShape>, xOffset: number=0, yOffset: number=0): boolean {
        const rectangleAx = this._boundsLocal.x + (this.entity?.position.x ?? 0) + xOffset;
        const rectangleAy = this._boundsLocal.y + (this.entity?.position.y ?? 0) + yOffset;
        const rectangleAw = this._boundsLocal.w;
        const rectangleAh = this._boundsLocal.h;
        const rectangleBx = collider._boundsLocal.x + (collider.entity?.position.x ?? 0);
        const rectangleBy = collider._boundsLocal.y + (collider.entity?.position.y ?? 0);
        const rectangleBw = collider._boundsLocal.w;
        const rectangleBh = collider._boundsLocal.h;
        return rectangleAx + rectangleAw > rectangleBx 
            && rectangleAy + rectangleAh > rectangleBy 
            && rectangleAx < rectangleBx + rectangleBw 
            && rectangleAy < rectangleBy + rectangleBh;
    }

    // does not consider active/inactive status
    public collideShape<U extends BoundableShape>(collider: Collider<U>, xOffset: number=0, yOffset: number=0): Collider<U> | null {
        const aOffset = xOffset != 0 || yOffset != 0
            ? { x: (this.entity?.position.x ?? 0) + xOffset, y: (this.entity?.position.y ?? 0) + yOffset }
            : this.entity?.position ?? Geometry.Point.Zero;
        return Geometry.Collide.AnyAny(this.shapeLocal as DeepReadonly<BoundableShape>, collider.shapeLocal as DeepReadonly<BoundableShape>, aOffset, collider.entity?.position ?? Geometry.Point.Zero)
            ? collider
            : null;
    }

    public get x(): number { return this._boundsLocal.x + (this.entity?.position.x ?? 0); }
    public get y(): number { return this._boundsLocal.y + (this.entity?.position.y ?? 0); }
    public get w(): number { return this._boundsLocal.w; };
    public get h(): number { return this._boundsLocal.h; }
    public get xLeft(): number { return this._boundsLocal.x + (this.entity?.position.x ?? 0); }
    public get xCenter(): number { return this.xLeft + this.w/2; }
    public get xRight(): number { return this._boundsLocal.x + this._boundsLocal.w + (this.entity?.position.x ?? 0); }
    public get yTop(): number { return this._boundsLocal.y + (this.entity?.position.y ?? 0); }
    public get yCenter(): number { return this.yTop + this.h/2; }
    public get yBottom(): number { return this._boundsLocal.y + this._boundsLocal.h + (this.entity?.position.y ?? 0); }
} 