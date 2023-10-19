import { Images } from '../core/images';
import { RNG } from '../core/rng';
import { clamp, DeepReadonly, rng } from '../core/utils';
import { World } from '../core/world';
import { Geometry } from '../geometry/geometry';
import { IPoint } from '../geometry/interfaces';
import { LoopTimer, Timer } from '../tools/timer';
import { WeightRange } from '../tools/weight-range';
import { CameraContext } from './camera-context';

export interface ISpriteFrame {
  indices: IPoint;
  timeWeight?: number; // defaults to 1 if not set
}

export interface ISpriteAnimation {
  get seconds(): number;
  speed: number;
  completion: number;
  get finished(): boolean;
  currentAnimationFrameIndex: number | null;
  get frameCount(): number;
  update(deltaMs: number): void;
  reset(): void;
}

export class SpriteAnimation implements ISpriteAnimation {
  private weightRange: WeightRange<IPoint>;
  private readonly timer: Timer;

  // speed can be negative
  // completion will also count backwards, non-looping animations will need to be set to completion=1 to do their animation
  public speed: number = 1;

  get seconds(): number {
    return this.timer.seconds;
  }
  get completion(): number {
    return this.timer.value;
  }
  set completion(value: number) {
    this.timer.value = clamp(value, 0, 1);
  }
  get finished(): boolean {
    return this.timer.finished;
  }

  /**
   * The frame indices within the image used for the current time in the current animation.
   * i.e. At the start of the animation, this value is the frame indices in the image of the first frame of the animation.
   */
  get currentIndices(): IPoint | null {
    return this.weightRange.value(this.timer.value);
  }
  /**
   * The frame index relative to the current time in the current animation.
   * i.e. At the start of the animation, this value is zero.
   */
  get currentAnimationFrameIndex(): number | null {
    return this.weightRange.index(this.timer.value);
  }
  set currentAnimationFrameIndex(frameIndex: number | null) {
    this.timer.value = this.weightRange.normalLowerBound(frameIndex ?? 0);
  }
  get frameCount(): number {
    return this.weightRange.range.length;
  }

  constructor(frames: DeepReadonly<ISpriteFrame[]>, seconds: number, loop: boolean = true, completion: number = 0) {
    this.timer = loop ? new LoopTimer(seconds) : new Timer(seconds);
    this.completion = completion;
    this.weightRange = new WeightRange<IPoint>(...frames.map(o => ({ value: o.indices, weight: o.timeWeight ?? 1 })));
  }

  update(deltaMs: number) {
    this.timer.update(deltaMs * this.speed);
  }
  reset() {
    this.timer.reset();
  }
  randomize(_rng?: RNG) {
    this.timer.value = (_rng ?? rng).random();
  }
}

export class SpriteTimer<T extends ISpriteAnimation = ISpriteAnimation> {
  protected readonly animationByName: {
    [animationName: string]: T;
  } = {};
  protected _currentAnimationName: string;
  public get currentAnimationName(): string {
    return this._currentAnimationName;
  }

  public get currentAnimationCompletion(): number {
    if (this._currentAnimationName in this.animationByName)
      return this.animationByName[this._currentAnimationName].completion;
    return 0;
  }
  public set currentAnimationCompletion(completion: number) {
    if (this._currentAnimationName in this.animationByName)
      this.animationByName[this._currentAnimationName].completion = completion;
  }
  public get currentAnimationSpeed(): number {
    if (this._currentAnimationName in this.animationByName)
      return this.animationByName[this._currentAnimationName].speed;
    return 0;
  }
  public set currentAnimationSpeed(speed: number) {
    if (this._currentAnimationName in this.animationByName)
      this.animationByName[this._currentAnimationName].speed = speed;
  }
  public get currentAnimationFrameIndex(): number | null {
    if (this._currentAnimationName in this.animationByName)
      return this.animationByName[this._currentAnimationName].currentAnimationFrameIndex;
    return null;
  }
  public set currentAnimationFrameIndex(frameIndex: number | null) {
    if (this._currentAnimationName in this.animationByName)
      this.animationByName[this._currentAnimationName].currentAnimationFrameIndex =
        (frameIndex ?? 0) % this.animationByName[this._currentAnimationName].frameCount;
  }
  public get currentAnimationFrameCount(): number | null {
    if (this._currentAnimationName in this.animationByName)
      return this.animationByName[this._currentAnimationName].frameCount;
    return null;
  }

  get isCurrentAnimationFinished(): boolean {
    if (!(this._currentAnimationName in this.animationByName)) return false;
    return this.animationByName[this._currentAnimationName].finished;
  }

  addAnimation(animationName: string, animation: T): this {
    this.animationByName[animationName] = animation;
    return this;
  }

  // forceChange = restart the animation if it's already the animation that's playing
  setAnimation(animationName: string, forceChange = false): this {
    if (!forceChange && animationName === this._currentAnimationName) return this;

    if (this._currentAnimationName in this.animationByName) this.animationByName[this._currentAnimationName].reset();
    this._currentAnimationName = animationName;
    return this;
  }

  getAnimation(animationName: string): T | null {
    return this.animationByName[animationName] ?? null;
  }

  resetCurrentAnimation(): this {
    if (this._currentAnimationName in this.animationByName) this.animationByName[this._currentAnimationName].reset();
    return this;
  }

  update(deltaMs: number) {
    if (this._currentAnimationName in this.animationByName)
      this.animationByName[this._currentAnimationName].update(deltaMs);
  }
}

export class Sprite extends SpriteTimer<SpriteAnimation> {
  constructor(
    public readonly world: World,
    public readonly images: Images,
    public readonly imageName: string,
    public readonly wFrame: number,
    public readonly hFrame: number
  ) {
    super();
  }

  override update() {
    super.update(this.world.delta);
  }

  draw(
    position: IPoint,
    scale: IPoint = Geometry.Point.One,
    angle: number = 0,
    center?: IPoint,
    alpha: number = 1,
    cameraContext: CameraContext = this.world
  ) {
    if (this._currentAnimationName in this.animationByName) {
      const animation = this.animationByName[this._currentAnimationName];
      const currentIndices = animation.currentIndices;
      if (currentIndices != null)
        this.drawFrame(position, currentIndices.x, currentIndices.y, scale, angle, center, alpha, cameraContext);
    } else if (this._currentAnimationName == null) {
      this.drawFrame(position, 0, 0, scale, angle, center, alpha, cameraContext);
    }
  }

  drawFrame(
    position: IPoint,
    xIndex: number,
    yIndex: number,
    scale: IPoint = Geometry.Point.One,
    angle?: number,
    center?: IPoint,
    alpha?: number,
    cameraContext: CameraContext = this.world
  ) {
    this.drawFrameExplicit(
      position.x,
      position.y,
      xIndex,
      yIndex,
      scale.x,
      scale.y,
      angle,
      center?.x,
      center?.y,
      alpha,
      cameraContext
    );
  }

  drawFrameExplicit(
    x: number,
    y: number,
    xIndex: number,
    yIndex: number,
    xScale?: number,
    yScale?: number,
    angle?: number,
    xCenter?: number,
    yCenter?: number,
    alpha?: number,
    cameraContext: CameraContext = this.world
  ) {
    this.images.drawPart(
      cameraContext,
      this.imageName,
      x,
      y,
      xIndex * this.wFrame,
      yIndex * this.hFrame,
      this.wFrame,
      this.hFrame,
      xScale,
      yScale,
      angle,
      xCenter,
      yCenter,
      alpha
    );
  }
}
