export class Images {
    private readonly srcByName: { [name: string]: string } = {};
    private readonly imageBySrc: { [src: string]: HTMLImageElement } = {}

    constructor() {}

    public get(name: string): HTMLImageElement {
        if(!(name in this.srcByName))
            throw `Image with name '${name}' not found. Add image using world.images.add('${name}', src)`;
        return this.getImageBySrc(this.srcByName[name]);
    }

    public add(name: string, src: string) {
        if(!(name in this.srcByName))
            this.srcByName[name] = src;
        if(!(src in this.imageBySrc)) {
            const image = new Image();
            image.src = src;
            this.imageBySrc[src] = image;
        }
    }

    private getImageBySrc(src: string): HTMLImageElement {
        if(!(src in this.imageBySrc))
            throw `Image with src '${src}' not found. Add image using world.images.add(imageName, '${src}')`;
        return this.imageBySrc[src];
    }
}