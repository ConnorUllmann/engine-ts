import { Images } from "../core/images";
import { IRectangle } from "../geometry/interfaces";

export interface CameraContext {
    camera: IRectangle,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
}

export interface ImagesCameraContext extends CameraContext {
    images: Images
}