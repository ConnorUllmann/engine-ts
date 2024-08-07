import { IPoint } from '../geometry/interfaces';
import { Point } from '../geometry/point';
import { Camera } from './camera';
import { DeepReadonly, enumToList } from './utils';

export enum MouseButton {
  Left = 0,
  Middle = 1,
  Right = 2,
}
export const MouseButtons = enumToList(MouseButton);

export enum MouseScroll {
  Up = 'Up',
  Down = 'Down',
}
export const MouseScrolls = enumToList(MouseScroll);

export interface IMouse {
  readonly leftReleased: boolean;
  readonly leftDown: boolean;
  readonly leftPressed: boolean;
  readonly rightReleased: boolean;
  readonly rightDown: boolean;
  readonly rightPressed: boolean;
  readonly middleReleased: boolean;
  readonly middleDown: boolean;
  readonly middlePressed: boolean;
  readonly moved: boolean;
  readonly focus: boolean;
  readonly scroll: DeepReadonly<IPoint>;
  readonly scrollPrevious: DeepReadonly<IPoint>;
  readonly touchscreen: boolean;
  readonly screenPosition: DeepReadonly<IPoint>;
  readonly worldPosition: DeepReadonly<IPoint>;
  readonly onCanvas: boolean;
}

export class MouseSnapshot implements IMouse {
  leftReleased: boolean = false;
  leftDown: boolean = false;
  leftPressed: boolean = false;
  rightReleased: boolean = false;
  rightDown: boolean = false;
  rightPressed: boolean = false;
  middleReleased: boolean = false;
  middleDown: boolean = false;
  middlePressed: boolean = false;
  moved: boolean = false;
  focus: boolean = false;
  scroll: Point = new Point();
  scrollPrevious: Point = new Point();
  touchscreen: boolean = false;
  screenPosition: Point = new Point();
  worldPosition: Point = new Point();
  onCanvas: boolean = false;

  public update(snapshot: IMouse): this {
    this.leftReleased = snapshot.leftReleased;
    this.leftDown = snapshot.leftDown;
    this.leftPressed = snapshot.leftPressed;
    this.rightReleased = snapshot.rightReleased;
    this.rightDown = snapshot.rightDown;
    this.rightPressed = snapshot.rightPressed;
    this.middleReleased = snapshot.middleReleased;
    this.middleDown = snapshot.middleDown;
    this.middlePressed = snapshot.middlePressed;
    this.moved = snapshot.moved;
    this.focus = snapshot.focus;
    this.scrollPrevious.setTo(this.scroll);
    this.scroll.setTo(snapshot.scroll);
    this.touchscreen = snapshot.touchscreen;
    this.screenPosition.setTo(snapshot.screenPosition);
    this.worldPosition.setTo(snapshot.worldPosition);
    this.onCanvas = snapshot.onCanvas;
    return this;
  }

  /**
   * Turns off all active inputs in the snapshot
   */
  public reset(): this {
    this.leftReleased = false;
    this.leftDown = false;
    this.leftPressed = false;
    this.rightReleased = false;
    this.rightDown = false;
    this.rightPressed = false;
    this.middleReleased = false;
    this.middleDown = false;
    this.middlePressed = false;
    this.moved = false;
    this.scroll.x = 0;
    this.scroll.y = 0;
    this.scrollPrevious.x = 0;
    this.scrollPrevious.y = 0;

    // Leave these however they were so they most accurately reflect the previous state
    // this.focus
    // this.touchscreen
    // this.onCanvas
    // this.screenPosition
    // this.worldPosition

    return this;
  }
}

export class Mouse extends Point implements IMouse {
  public leftReleased: boolean = false;
  public leftPressed: boolean = false;
  public rightReleased: boolean = false;
  public rightPressed: boolean = false;
  public middleReleased: boolean = false;
  public middlePressed: boolean = false;
  public leftDown: boolean = false;
  public middleDown: boolean = false;
  public rightDown: boolean = false;
  public moved: boolean = false;
  public focus: boolean = false;
  public scroll: Point = new Point();
  public scrollPrevious: Point = new Point();
  public get touchscreen(): boolean {
    return 'ontouchstart' in document.documentElement;
  }

  // position relative to the screen, e.g. always (0, 0) whenever the mouse is on the top-left pixel
  public get screenPosition(): DeepReadonly<IPoint> {
    return this;
  }
  // position in the world relative to the camera
  private readonly _worldPosition = new Point();
  public get worldPosition(): DeepReadonly<IPoint> {
    return this._worldPosition.setToXY(this.camera.x + this.x, this.camera.y + this.y);
  }

  public active = true;

  public hasInputThisFrame = false;

  public get onCanvas(): boolean {
    return (
      this.focus &&
      this.x != null &&
      this.y != null &&
      this.x >= 0 &&
      this.x < this.camera.w &&
      this.y >= 0 &&
      this.y < this.camera.h
    );
  }

  private mouseMoveHandler = (mouseEvent: MouseEvent) => {
    if (!this.active) return;

    const rect = this.canvas.getBoundingClientRect();
    const canvasScale = this.camera.canvasScale;
    if (canvasScale.x == canvasScale.y) {
      this.x = (mouseEvent.clientX - rect.left) * canvasScale.x;
      this.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
    } else {
      if (this.canvas.style.objectFit === 'contain') {
        const wExpected = (this.canvas.clientHeight / this.canvas.height) * this.canvas.width;
        if (this.canvas.clientWidth > wExpected) {
          const smallerCanvasScale = canvasScale.y;
          const marginsWidthTotal = this.canvas.clientWidth - wExpected;
          this.x = (mouseEvent.clientX - (rect.left + marginsWidthTotal / 2)) * smallerCanvasScale;
          this.y = (mouseEvent.clientY - rect.top) * smallerCanvasScale;
        } else {
          const hExpected = (this.canvas.clientWidth / this.canvas.width) * this.canvas.height;
          const smallerCanvasScale = canvasScale.x;
          const marginsHeightTotal = this.canvas.clientHeight - hExpected;
          this.x = (mouseEvent.clientX - rect.left) * smallerCanvasScale;
          this.y = (mouseEvent.clientY - (rect.top + marginsHeightTotal / 2)) * smallerCanvasScale;
        }
      } else {
        const clientScaledWidth = (this.canvas.clientWidth / this.canvas.clientHeight) * this.camera.h;
        const marginsWidthTotal = clientScaledWidth - this.camera.w;
        const xMouseShifted = (mouseEvent.clientX - rect.left) * canvasScale.y;
        this.x = xMouseShifted - marginsWidthTotal / 2;
        this.y = (mouseEvent.clientY - rect.top) * canvasScale.y;
      }
    }
    this.moved = true;
    this.hasInputThisFrame = true;
  };
  private touchStartHandler = (_touchEvent: TouchEvent) => {
    if (!this.active) return;

    this.leftMouseDownEvent();
  };
  private touchEndHandler = (_touchEvent: TouchEvent) => {
    if (!this.active) return;

    this.leftMouseUpEvent();
  };
  private mouseUpHandler = (mouseEvent: MouseEvent) => {
    if (!this.active) return;

    switch (mouseEvent.button) {
      case MouseButton.Left:
        this.leftMouseUpEvent();
        break;
      case MouseButton.Middle:
        this.middleMouseUpEvent();
        break;
      case MouseButton.Right:
        this.rightMouseUpEvent();
        break;
    }
  };
  private mouseDownHandler = (mouseEvent: MouseEvent) => {
    if (!this.active) return;

    switch (mouseEvent.button) {
      case MouseButton.Left:
        this.leftMouseDownEvent();
        break;
      case MouseButton.Middle:
        this.middleMouseDownEvent();
        break;
      case MouseButton.Right:
        this.rightMouseDownEvent();
        break;
    }
  };
  private mouseOutHandler = (_mouseEvent: MouseEvent) => {
    if (!this.active) return;

    this.hasInputThisFrame = true;
    this.focus = false;
  };
  private mouseOverHandler = (_mouseEvent: MouseEvent) => {
    if (!this.active) return;

    this.hasInputThisFrame = true;
    this.focus = true;
  };
  private wheelHandler = (wheelEvent: WheelEvent) => {
    if (!this.active) return;

    this.hasInputThisFrame = true;
    this.scroll.y = wheelEvent.deltaY;
  };

  private eventTarget: HTMLElement;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly camera: Camera,
    // Default to putting mouse up/down events on the document body (so that letting go of the mouse outside the canvas is still caught)
    // but allow setting mouse events on the canvas instead if other HTML elements are going to overlap and you want to stop propagation
    // to the canvas.
    areMouseEventsOnDocumentBody = true
  ) {
    super();

    this.eventTarget = areMouseEventsOnDocumentBody ? document.body : this.canvas;
  }

  private started = false;

  destroy() {
    if (!this.started) return;

    this.started = false;

    if (this.touchscreen) {
      this.eventTarget.removeEventListener('touchstart', this.touchStartHandler);
      this.eventTarget.removeEventListener('touchend', this.touchEndHandler);
    }

    this.eventTarget.removeEventListener('mouseup', this.mouseUpHandler);
    this.eventTarget.removeEventListener('mousedown', this.mouseDownHandler);

    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler, false);
    this.canvas.removeEventListener('mouseout', this.mouseOutHandler);
    this.canvas.removeEventListener('mouseover', this.mouseOverHandler);
    this.canvas.removeEventListener('wheel', this.wheelHandler);
  }

  start() {
    if (this.started) return;

    this.started = true;

    if (this.touchscreen) {
      this.eventTarget.addEventListener('touchstart', this.touchStartHandler);
      this.eventTarget.addEventListener('touchend', this.touchEndHandler);
    }

    this.eventTarget.addEventListener('mouseup', this.mouseUpHandler);
    this.eventTarget.addEventListener('mousedown', this.mouseDownHandler);

    this.canvas.addEventListener('mousemove', this.mouseMoveHandler, false);
    this.canvas.addEventListener('mouseout', this.mouseOutHandler);
    this.canvas.addEventListener('mouseover', this.mouseOverHandler);
    this.canvas.addEventListener('wheel', this.wheelHandler);
    this.update();
  }

  /**
   * Resets the state of the keyboard so all inputs are considered unused.
   * @param includeIrrecoverableInputs Some inputs, like whether a key is "down," is not recoverable when reset (i.e. its state cannot be simply updated on the next frame). These inputs are not reset by default.
   */
  reset(includeIrrecoverableInputs = false): void {
    this.leftReleased = false;
    this.leftPressed = false;
    this.middleReleased = false;
    this.middlePressed = false;
    this.rightReleased = false;
    this.rightPressed = false;
    this.scrollPrevious.x = 0;
    this.scrollPrevious.y = 0;
    this.scroll.x = 0;
    this.scroll.y = 0;
    this.moved = false;
    this.hasInputThisFrame = false;

    if (includeIrrecoverableInputs) {
      this.leftDown = false;
      this.middleDown = false;
      this.rightDown = false;
      this.focus = false;
    }
  }

  update(): void {
    if (!this.active) return;

    this.leftReleased = false;
    this.leftPressed = false;
    this.middleReleased = false;
    this.middlePressed = false;
    this.rightReleased = false;
    this.rightPressed = false;
    this.scrollPrevious.x = this.scroll.x;
    this.scrollPrevious.y = this.scroll.y;
    this.scroll.x = 0;
    this.scroll.y = 0;
    this.moved = false;
    this.hasInputThisFrame = false;
  }

  allPressed(): (MouseButton | MouseScroll)[] {
    const result: (MouseButton | MouseScroll)[] = [];
    if (this.leftPressed) result.push(MouseButton.Left);
    if (this.middlePressed) result.push(MouseButton.Middle);
    if (this.rightPressed) result.push(MouseButton.Right);
    if (this.scroll.y > 0 && this.scrollPrevious.y <= 0) result.push(MouseScroll.Down);
    if (this.scroll.y < 0 && this.scrollPrevious.y >= 0) result.push(MouseScroll.Up);
    return result;
  }

  allDown(): (MouseButton | MouseScroll)[] {
    const result: (MouseButton | MouseScroll)[] = [];
    if (this.leftDown) result.push(MouseButton.Left);
    if (this.middleDown) result.push(MouseButton.Middle);
    if (this.rightDown) result.push(MouseButton.Right);
    if (this.scroll.y > 0) result.push(MouseScroll.Down);
    if (this.scroll.y < 0) result.push(MouseScroll.Up);
    return result;
  }

  allReleased(): (MouseButton | MouseScroll)[] {
    const result: (MouseButton | MouseScroll)[] = [];
    if (this.leftReleased) result.push(MouseButton.Left);
    if (this.middleReleased) result.push(MouseButton.Middle);
    if (this.rightReleased) result.push(MouseButton.Right);
    if (this.scroll.y <= 0 && this.scrollPrevious.y > 0) result.push(MouseScroll.Down);
    if (this.scroll.y >= 0 && this.scrollPrevious.y < 0) result.push(MouseScroll.Up);
    return result;
  }

  private leftMouseDownEvent(): void {
    this.hasInputThisFrame = true;
    this.leftPressed = true;
    this.leftDown = true;
  }

  private leftMouseUpEvent(): void {
    this.hasInputThisFrame = true;
    this.leftReleased = true;
    this.leftDown = false;
  }

  private middleMouseDownEvent(): void {
    this.hasInputThisFrame = true;
    this.middlePressed = true;
    this.middleDown = true;
  }

  private middleMouseUpEvent(): void {
    this.hasInputThisFrame = true;
    this.middleReleased = true;
    this.middleDown = false;
  }

  private rightMouseDownEvent(): void {
    this.hasInputThisFrame = true;
    this.rightPressed = true;
    this.rightDown = true;
  }

  private rightMouseUpEvent(): void {
    this.hasInputThisFrame = true;
    this.rightReleased = true;
    this.rightDown = false;
  }
}
