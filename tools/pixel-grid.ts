import { Color } from '@engine-ts/visuals/color';
import { IPoint, IRectangle } from '@engine-ts/geometry/interfaces';
import { World } from '@engine-ts/core/world';
import { Geometry } from '@engine-ts/geometry/geometry';

export class PixelGrid {
    private context: CanvasRenderingContext2D;
    private imageData: ImageData;

    public get w(): number { return this.canvas.width; }
    public get h(): number { return this.canvas.height; }

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.context = canvas.getContext("2d");
        this.refreshImageData();
    }

    // TODO: optional rectangle input to define what part of the image to use (null means all of it)
    refreshImageData() {
        this.imageData = this.getImageData();
    };

    // TODO: optional rectangle input to define what part of the image to use (null means all of it)
    getImageData() {
        return this.context.getImageData(0, 0, this.w, this.h);
    };

    // Applies the changes made to the pixels in the grid to the actual canvas itself
    putImageData() {
        this.context.putImageData(this.imageData, 0, 0);
    };

    // filter = Function that takes in an (x, y) position and a function which can retrieve the color of any pixel
    //          in the canvas given its (x, y) position. It returns the resulting filtered Color.
    applyFilter(filter: (position: IPoint, getColor: (position: IPoint) => Color) => Color) {
        this.setEach((position) => filter(position, (position) => this.get(position)));
        this.putImageData();
    };

    // Necessary if you're going to use the values of neighboring pixels so that they aren't partially updated
    // Note: it's slower than .applyFilter()
    applyFilterWithBuffer(filter: (position: IPoint, getColor: (position: IPoint) => Color) => Color) {
        const pixelGridTemp = new PixelGrid(this.canvas);
        pixelGridTemp.setEach((position) => filter(position, (position) => this.get(position)));
        this.setEach((position) => pixelGridTemp.get(position));
        this.putImageData();
    };

    renderToContext(context: CanvasRenderingContext2D,
        position: IPoint=Geometry.Point.Zero,
        scale: IPoint=Geometry.Point.One,
        section: IRectangle={ x:0, y:0, w:this.canvas.width, h:this.canvas.height }
    ) {
        context.drawImage(this.canvas,
            section.x, section.y, section.w, section.h,
            position.x, position.y, section.w * scale.x, section.h * scale.y);
    };

    draw(world: World, position: IPoint=Geometry.Point.Zero, scale: IPoint=Geometry.Point.One, section?: IRectangle) {
        const imageSmoothingEnabled = world.context.imageSmoothingEnabled;
        world.context.imageSmoothingEnabled = false;
        if(section != null)
            this.renderToContext(world.context, Geometry.Point.Subtract(position, world.camera), scale, section);
        else
            this.renderToContext(world.context, Geometry.Point.Subtract(position, world.camera), scale);
        world.context.imageSmoothingEnabled = imageSmoothingEnabled;
    };

    private transformXYToIndex({ x, y }: IPoint): number {
        return 4 * (Math.floor(x) + Math.floor(y) * this.w);
    };

    private transformIndexToXY(index: number): IPoint {
        index /= 4;
        return {
            x: index % this.w,
            y: Math.floor(index / this.w)
        };
    };

    isInside({ x, y }: IPoint): boolean {
        return y >= 0 && y < this.h && x >= 0 && x < this.w;
    }

    set(position: IPoint, color: Color): void {
        if(!this.isInside(position))
            return;
        const index = this.transformXYToIndex(position);
        this.imageData.data[index] = color.red;
        this.imageData.data[index+1] = color.green;
        this.imageData.data[index+2] = color.blue;
        this.imageData.data[index+3] = color.alpha * 255;
    };

    get(position: IPoint): Color | null {
        if(!this.isInside(position))
            return null;
        const index = this.transformXYToIndex(position);
        return new Color(
            this.imageData.data[index],
            this.imageData.data[index+1],
            this.imageData.data[index+2],
            this.imageData.data[index+3] / 255
        );
    };

    setEach(getColor: (position: IPoint) => Color): void {
        for(let x = 0; x < this.w; x++) {
            for(let y = 0; y < this.h; y++) {
                const position = { x, y };
                this.set(position, getColor(position));
            }
        }
    };

    forEach(pixelCall: (position: IPoint, color: Color) => void): void {
        for(let x = 0; x < this.w; x++) {
            for(let y = 0; y < this.h; y++) {
                const position = { x, y };
                pixelCall(position, this.get(position));
            }
        }
    };

    map<T>(getColor: (position: IPoint, color: Color) => T): T[] {
        const results = [];
        for(let x = 0; x < this.w; x++) {
            for(let y = 0; y < this.h; y++) {
                const position = { x, y };
                results.push(getColor(position, this.get(position)));
            }
        }
        return results;
    }
}