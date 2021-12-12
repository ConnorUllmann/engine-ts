import { CameraContext } from "../visuals/camera-context";
import { Draw } from "../visuals/draw";

export class Images {
    private readonly srcByName: { [name: string]: string } = {};
    private readonly imageBySrc: { [src: string]: HTMLImageElement } = {}
    private readonly srcsWaitingToLoad = new Set();

    constructor() {}

    public allLoaded(): boolean {
        return this.srcsWaitingToLoad.size <= 0;
    }

    public getWidth(name: string): number | null {
        return this.get(name)?.width ?? null;
    }

    public getHeight(name: string): number | null {
        return this.get(name)?.height ?? null;
    }
    
    public get(name: string): HTMLImageElement | null {
        return name in this.srcByName && !this.srcsWaitingToLoad.has(this.srcByName[name])
            ? this.getImageBySrc(this.srcByName[name])
            : null;
    }

    public add(name: string, src: string) {
        if(!(name in this.srcByName))
            this.srcByName[name] = src;
        if(!(src in this.imageBySrc)) {
            const image = new Image();

            this.srcsWaitingToLoad.add(src);
            image.onload = () => { this.srcsWaitingToLoad.delete(src); }

            image.src = src;
            this.imageBySrc[src] = image;
        }
    }

    private getImageBySrc(src: string): HTMLImageElement {
        if(!(src in this.imageBySrc))
            throw `Image with src '${src}' not found. Add image using world.images.add(imageName, '${src}')`;
        return this.imageBySrc[src];
    }

    public drawPart(
        cameraContext: CameraContext,
        imageName: string,
        x: number,
        y: number,
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        xScale?: number,
        yScale?: number,
        angle?: number,
        xCenter?: number,
        yCenter?: number,
        alpha?:number
    ) {
        Draw.Explicit.ImagePart(
            cameraContext,
            this.get(imageName),
            x,
            y,
            sx,
            sy,
            sw,
            sh,
            xScale,
            yScale,
            angle,
            xCenter,
            yCenter,
            alpha,
        )
    }

    public draw(
        cameraContext: CameraContext,
        imageName: string,
        x: number,
        y: number,
        xScale?: number,
        yScale?: number,
        angle?: number,
        xCenter?: number,
        yCenter?: number,
        alpha?:number
    ) {
        Draw.Explicit.Image(
            cameraContext,
            this.get(imageName),
            x,
            y,
            xScale,
            yScale,
            angle,
            xCenter,
            yCenter,
            alpha,
        )
    }
}