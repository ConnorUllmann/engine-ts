export function createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

export function createCanvasScreenshotElement(canvas: HTMLCanvasElement): HTMLImageElement {
    var newImg = document.createElement('img');
    canvas.toBlob(function(blob) {
        var url = URL.createObjectURL(blob);
        newImg.onload = function() { URL.revokeObjectURL(url); };
        newImg.src = url;
        newImg.style.padding="2px";
    });
    return newImg;
}