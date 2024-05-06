import { Geometry } from '../geometry/geometry';
import { IPoint, IRectangle } from '../geometry/interfaces';
import { Point } from '../geometry/point';
import { Rectangle } from '../geometry/rectangle';

export class Camera extends Rectangle {
  public get w(): number {
    return this.canvas.width;
  }
  public get h(): number {
    return this.canvas.height;
  }

  // TODO: add ability to set zoom level; check if setting screen resolution is all you need to do?

  constructor(
    private readonly canvas: {
      width: number;
      height: number;
      clientWidth: number;
      clientHeight: number;
    }
  ) {
    super(0, 0, canvas.width, canvas.height);
  }

  public get canvasScale(): Point {
    return new Point(this.w / this.canvas.clientWidth, this.h / this.canvas.clientHeight);
  }

  public isRectangleVisible(rectangle: IRectangle, margin: number = 0): boolean {
    return this.isRectangleVisibleExplicit(rectangle.x, rectangle.y, rectangle.w, rectangle.h, margin);
  }

  public isRectangleVisibleExplicit(x: number, y: number, w: number, h: number, margin: number = 0): boolean {
    return Geometry.CollideExplicit.RectangleRectangle(
      this.x - margin,
      this.y - margin,
      this.w + 2 * margin,
      this.h + 2 * margin,
      x,
      y,
      w,
      h
    );
  }

  public isPointVisible(position: IPoint, margin: number = 0): boolean {
    return this.isPointVisibleExplicit(position.x, position.y, margin);
  }

  public isPointVisibleExplicit(x: number, y: number, margin: number = 0): boolean {
    return Geometry.CollideExplicit.RectanglePoint(
      this.x - margin,
      this.y - margin,
      this.w + 2 * margin,
      this.h + 2 * margin,
      x,
      y
    );
  }
}
