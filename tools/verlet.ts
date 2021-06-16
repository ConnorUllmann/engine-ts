import { Geometry } from "@engine-ts/geometry/geometry";
import { IPoint } from "@engine-ts/geometry/interfaces";

export interface IVerletPoint extends IPoint {
    mass: number,
    canMove: boolean,
    update(): void,
}

export interface IVerletStick<P extends IVerletPoint> {
    a: P,
    b: P,
    update(): void,
}

export class VerletPoint implements IPoint {
    public readonly previous = { x: 0, y: 0 };
    public readonly gravity = { x: 0, y: 1 };
    public canMove = true;

    constructor(public x: number, public y: number, public mass: number = 1, public friction: number = 0.9) {
        this.previous.x = x;
        this.previous.y = y;
    }

    update(): this {
        if(!this.canMove)
            return this;

        const xVelocity = (this.x - this.previous.x) * this.friction;
        const yVelocity = (this.y - this.previous.y) * this.friction;

        this.previous.x = this.x;
        this.previous.y = this.y;

        this.x += xVelocity + this.gravity.x;
        this.y += yVelocity + this.gravity.y;

        return this;
    };
}

export class VerletStick implements IVerletStick<VerletPoint> {
    public equilibriumLength: number;

    // When length is null, the distance between the two points at the point of the stick's creation is used
    constructor(public a: VerletPoint, public b: VerletPoint, length: number | null=null, public stiffness: number=2) {
        this.equilibriumLength = length ?? Geometry.Point.Distance(a, b);    
    }

    public get currentLength(): number {
        return Geometry.Point.Distance(this.a, this.b);
    }

    update(): this {
        const xDiff = this.b.x - this.a.x;
        const yDiff = this.b.y - this.a.y;
        const currentLength = Geometry.Distance(xDiff, yDiff);
        const scale = 0.5 * (this.equilibriumLength - currentLength) / Math.max(0.0001, currentLength) * this.stiffness;
        const xOffset = xDiff * scale;
        const yOffset = yDiff * scale;
    
        const massTotal = this.a.mass + this.b.mass;
    
        if(this.a.canMove) {
            const massNormalA = this.b.mass / massTotal;
            this.a.x -= xOffset * massNormalA;
            this.a.y -= yOffset * massNormalA;
        }
    
        if(this.b.canMove) {
            const massNormalB = this.a.mass / massTotal;
            this.b.x += xOffset * massNormalB;
            this.b.y += yOffset * massNormalB;
        }

        return this;
    };
}

export class VerletSystem<P extends IVerletPoint, S extends IVerletStick<P>> {
    public readonly verletPointSet = new Set<P>();
    public readonly verletStickSet = new Set<S>();

    constructor() {}

    addStick(verletStick: S): this {
        this.verletStickSet.add(verletStick);
        this.verletPointSet.add(verletStick.a);
        this.verletPointSet.add(verletStick.b);
        return this;
    }

    updatePoints(): this {
        for(const verletPoint of this.verletPointSet)
            verletPoint.update();
        return this;
    }

    updateSticks(): this {
        for(const verletStick of this.verletStickSet)
            verletStick.update();
        return this;
    }

    update(): this {
        return this.updatePoints().updateSticks();
    }
}