import { IRectangle } from "../geometry/interfaces";

export interface CameraContext {
    camera: IRectangle,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
}
