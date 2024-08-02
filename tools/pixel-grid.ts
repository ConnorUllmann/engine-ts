import { DeepReadonly } from '../core/utils';
import { Geometry } from '../geometry/geometry';
import { Grid, IGrid } from '../geometry/grid';
import { IPoint, IRectangle } from '../geometry/interfaces';
import { Point } from '../geometry/point';
import { CameraContext } from '../visuals/camera-context';
import { Color } from '../visuals/color';

export class PixelGrid implements IGrid<Color> {
  public context: OffscreenCanvasRenderingContext2D;
  private imageData: ImageData = undefined as unknown as ImageData;
  public imageSmoothingEnabled: boolean = false;

  public get w(): number {
    return this.canvas.width;
  }
  public get h(): number {
    return this.canvas.height;
  }

  constructor(public readonly canvas: OffscreenCanvas) {
    this.context = canvas.getContext('2d', { willReadFrequently: true }) as OffscreenCanvasRenderingContext2D;
    this.refreshImageData();
  }

  private transformXYToIndex({ x, y }: IPoint): number {
    return 4 * (Math.floor(x) + Math.floor(y) * this.w);
  }

  // TODO: optional rectangle input to define what part of the image to use (null means all of it)
  public refreshImageData(): this {
    this.imageData = this.getImageData();
    return this;
  }

  // TODO: optional rectangle input to define what part of the image to use (null means all of it)
  public getImageData() {
    return this.context.getImageData(0, 0, this.w, this.h);
  }

  // Applies the changes made to the pixels in the grid to the actual canvas itself
  public putImageData(): this {
    this.context.putImageData(this.imageData, 0, 0);
    return this;
  }

  // filter = Function that takes in an (x, y) position and a function which can retrieve the color of any pixel
  //          in the canvas given its (x, y) position. It returns the resulting filtered Color.
  public applyFilter(filter: (position: IPoint, getColor: (position: IPoint) => Color | null) => DeepReadonly<Color>) {
    Grid.SetEach(this, position => filter(position, position => this.get(position)));
    this.putImageData();
  }

  // Necessary if you're going to use the values of neighboring pixels so that they aren't partially updated
  // Note: it's slower than .applyFilter()
  public applyFilterWithBuffer(
    filter: (position: IPoint, getColor: (position: IPoint) => Color | null) => DeepReadonly<Color>
  ): this {
    const pixelGridTemp = new PixelGrid(this.canvas);
    Grid.SetEach(pixelGridTemp, position => filter(position, p => this.get(p)));
    Grid.SetEach(this, position => pixelGridTemp.get(position)!);
    this.putImageData();
    return this;
  }

  public renderToContext(
    context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
    position: IPoint = Geometry.Point.Zero,
    scale: IPoint = Geometry.Point.One,
    section: IRectangle = {
      x: 0,
      y: 0,
      w: this.canvas.width,
      h: this.canvas.height,
    }
  ) {
    context.drawImage(
      this.canvas,
      section.x,
      section.y,
      section.w,
      section.h,
      position.x,
      position.y,
      section.w * scale.x,
      section.h * scale.y
    );
  }

  public draw(
    cameraContext: CameraContext,
    position: IPoint = Geometry.Point.Zero,
    scale: IPoint = Geometry.Point.One,
    section?: IRectangle
  ) {
    const imageSmoothingEnabled = cameraContext.context.imageSmoothingEnabled;
    cameraContext.context.imageSmoothingEnabled = this.imageSmoothingEnabled;
    if (section != null)
      this.renderToContext(
        cameraContext.context,
        Geometry.Point.Subtract(position, cameraContext.camera),
        scale,
        section
      );
    else this.renderToContext(cameraContext.context, Geometry.Point.Subtract(position, cameraContext.camera), scale);
    cameraContext.context.imageSmoothingEnabled = imageSmoothingEnabled;
  }

  public set(position: IPoint, color: DeepReadonly<Color>): this {
    if (Grid.IsInside(this, position)) {
      const index = this.transformXYToIndex(position);
      this.imageData.data[index] = color.red;
      this.imageData.data[index + 1] = color.green;
      this.imageData.data[index + 2] = color.blue;
      this.imageData.data[index + 3] = color.alpha * 255;
    }
    return this;
  }

  public get(position: IPoint): Color | null {
    if (!Grid.IsInside(this, position)) return null;
    const index = this.transformXYToIndex(position);
    return new Color(
      this.imageData.data[index],
      this.imageData.data[index + 1],
      this.imageData.data[index + 2],
      this.imageData.data[index + 3] / 255
    );
  }

  public forEachWithGetter(pixelCall: (position: IPoint, getColor: (position: IPoint) => Color) => void): this {
    const position = new Point();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        position.setToXY(x, y);
        pixelCall(position, p => this.get(p)!);
      }
    return this;
  }
}
