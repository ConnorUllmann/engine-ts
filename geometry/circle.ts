import { Point } from './point';
import { ICircle, IPoint, IRectangle } from './interfaces';
import { tau } from '@engine-ts/core/utils';
import { Geometry } from './geometry';


export class Circle extends Point implements ICircle { 
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y);
    }
    public cloneCircle(): Circle { return new Circle(this.x, this.y, this.radius); }

    public get circumference(): number { return tau * this.radius; }
    public get area(): number { return Math.PI * this.radius * this.radius; }
    public get bounds(): IRectangle { return Geometry.Rectangle.BoundsCircle(this); }
    public get diameter(): number { return this.radius * 2; }
    public collidesPoint(point: IPoint): boolean { return Geometry.Collide.CirclePoint(this, point); }
    public collidesRectangle(rectangle: IRectangle): boolean { return Geometry.Collide.RectangleCircle(rectangle, this); }
}

