import { World } from './world';
import { Point } from '../geometry/point';
import { Geometry } from '@engine-ts/geometry/geometry';
import { IPoint } from '@engine-ts/geometry/interfaces';

export enum MouseButton {
    Left = 0,
    Right = 2
}

export class Mouse extends Point {
    public leftReleased: boolean = false;
    public leftPressed: boolean = false;    
    public rightReleased: boolean = false;    
    public rightPressed: boolean = false;
    public leftDown: boolean = false;
    public rightDown: boolean = false;
    public focus: boolean = false;
    public scroll: Point = new Point();
    public get touchscreen(): boolean { return 'ontouchstart' in document.documentElement; }

    // position relative to the screen, e.g. always (0, 0) whenever the mouse is on the top-left pixel
    public get screenPosition(): IPoint { return this; }
    // position in the world relative to the camera
    public get worldPosition(): IPoint { return Geometry.Point.Add(this.world.camera, this); }

    constructor(public world: World) { super(); }

    public start(): void {
        const mouse = this;
        this.world.canvas.addEventListener('mousemove', (mouseEvent: MouseEvent) => {
            const canvasScale = mouse.world.camera.canvasScale;
            const rect = mouse.world.canvas.getBoundingClientRect();
            mouse.x = (mouseEvent.clientX - rect.left) * canvasScale.x;
            mouse.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
        }, false);

        if(this.touchscreen) {
            document.body.addEventListener("touchstart", (touchEvent: TouchEvent) => mouse.leftMouseDownEvent());
            document.body.addEventListener("touchend", (touchEvent: TouchEvent) => mouse.leftMouseUpEvent());
        }
        
        document.body.addEventListener("mouseup", (mouseEvent: MouseEvent) => {
            switch(mouseEvent.button) {
                case MouseButton.Left:
                    mouse.leftMouseUpEvent();
                    break;
                case MouseButton.Right:
                    mouse.rightMouseUpEvent();
                    break;
            }
        });
        document.body.addEventListener("mousedown", (mouseEvent: MouseEvent) => {
            switch(mouseEvent.button) {
                case MouseButton.Left:
                    mouse.leftMouseDownEvent();
                    break;
                case MouseButton.Right:
                    mouse.rightMouseDownEvent();
                    break;
            }
        });
        this.world.canvas.addEventListener ("mouseout", (mouseEvent: MouseEvent) => mouse.focus = false);
        this.world.canvas.addEventListener ("mouseover", (mouseEvent: MouseEvent) => mouse.focus = true);
        this.world.canvas.addEventListener('wheel', (wheelEvent: WheelEvent) => mouse.scroll.y = wheelEvent.deltaY);
        this.update();
    };

    public update(): void {
        this.leftReleased = false;
        this.leftPressed = false;
        this.rightReleased = false;
        this.rightPressed = false;
        this.scroll.x = 0;
        this.scroll.y = 0;
    }

    public onCanvas(): boolean {
        return this.focus 
            && this.x != null 
            && this.y != null 
            && this.x >= 0 
            && this.x < this.world.camera.w 
            && this.y >= 0 && this.y < this.world.camera.h;
    }

    private leftMouseDownEvent(): void {
        this.leftPressed = true;
        this.leftDown = true;
    };

    private leftMouseUpEvent(): void {
        this.leftReleased = true;
        this.leftDown = false;
    };

    private rightMouseDownEvent(): void {
        this.rightPressed = true;
        this.rightDown = true;
    };

    private rightMouseUpEvent(): void {
        this.rightReleased = true;
        this.rightDown = false;
    };
}