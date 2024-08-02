export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createCanvasScreenshotElement(canvas: OffscreenCanvas | HTMLCanvasElement): HTMLImageElement {
  var newImg = document.createElement('img');
  const blobFn = function (blob: Blob | null) {
    if (!blob) return null;
    var url = URL.createObjectURL(blob);
    newImg.onload = function () {
      URL.revokeObjectURL(url);
    };
    newImg.src = url;
  };
  if ('convertToBlob' in canvas) (canvas as any).convertToBlob().then(blobFn);
  else if ('toBlob' in canvas) canvas.toBlob(blobFn);
  return newImg;
}
