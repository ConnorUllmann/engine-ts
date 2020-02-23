import { Rectangle } from '../geometry/rectangle';
import { World } from './world';
import { Point } from '../geometry/point';

export class Camera extends Rectangle {
    public get w(): number { return this.world.canvas.width; }
    public get h(): number { return this.world.canvas.height; }

    constructor(public world: World) {
        super(0, 0, world.canvas.width, world.canvas.height);
    }

    public rectangleIsVisible(rectangle: Rectangle): boolean { return this.collidesRectangle(rectangle); }
    public pointIsVisible(point: Point): boolean { return this.collidesPoint(point); }

    public get canvasScale(): Point {
        return new Point(
            this.world.camera.w / this.world.canvas.clientWidth,
            this.world.camera.h / this.world.canvas.clientHeight
        );
    }
}