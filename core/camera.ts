import { Rectangle } from '../geometry/rectangle';
import { Point } from '../geometry/point';

export class Camera extends Rectangle {
    public get w(): number { return this.canvas.width; }
    public get h(): number { return this.canvas.height; }

    // TODO: add ability to set zoom level; check if setting screen resolution is all you need to do?

    constructor(private readonly canvas: HTMLCanvasElement) {
        super(0, 0, canvas.width, canvas.height);
    }

    public rectangleIsVisible(rectangle: Rectangle): boolean { return this.collidesRectangle(rectangle); }
    public pointIsVisible(point: Point): boolean { return this.collidesPoint(point); }

    public get canvasScale(): Point {
        return new Point(
            this.w / this.canvas.clientWidth,
            this.h / this.canvas.clientHeight
        );
    }
}