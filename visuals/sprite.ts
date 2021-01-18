import { clamp, random } from '@engine-ts/core/utils';
import { World } from '@engine-ts/core/world';
import { Geometry } from '@engine-ts/geometry/geometry';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { LoopTimer, Timer } from '@engine-ts/tools/timer';
import { Draw, ImagesCameraContext } from './draw';

export interface ISpriteFrame {
    indices: IPoint,
    timeWeight: number,
}

export class SpriteAnimation {
    private readonly timer: Timer;
    private readonly timeWeightTotal: number;
    public speed: number = 1; // must be >= 0
    public get seconds(): number { return this.timer.seconds; }
    public get completion(): number { return this.timer.value; }
    public set completion(value: number) { this.timer.value = clamp(value, 0, 1);}

    constructor(
        private readonly frames: ISpriteFrame[],
        seconds: number,
        loop: boolean=true,
        completion: number=0,
    ) {
        this.timer = loop ? new LoopTimer(seconds) : new Timer(seconds);
        this.completion = completion;
        this.timeWeightTotal = this.frames.sumOf(o => o.timeWeight);
    }

    public get finished(): boolean { return this.timer.finished; }

    update(deltaMs: number) {
        this.timer.update(deltaMs * this.speed);
    }

    reset() {
        this.timer.reset();
    }

    randomize() {
        this.timer.value = random();
    }

    get currentIndices(): IPoint | null {
        const frameIndex = this.currentFrameIndex;
        return frameIndex != null
            ? this.frames[frameIndex].indices
            : null;
    }

    get currentFrameIndex(): number | null {
        if(this.frames.length <= 0)
            return null;
        
        let timeWeight = 0;
        for(let i = 0; i < this.frames.length; i++) {
            const frame = this.frames[i];
            if(i == this.frames.length - 1)
                return i;

            timeWeight += frame.timeWeight;
            if(this.timer.value <= timeWeight / this.timeWeightTotal)
                return i;
        }
    }
}

export class Sprite {
    private readonly animationByName: { [animationName: string]: SpriteAnimation } = {};
    private _currentAnimationName: string;
    public get currentAnimationName(): string { return this._currentAnimationName; }

    public get currentAnimationCompletion(): number { 
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].completion;
        return 0;
    }
    public get currentAnimationSpeed(): number { 
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].speed;
        return 0;
    }
    public set currentAnimationSpeed(speed: number) { 
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].speed = speed;
    }
    public get currentAnimationFrameIndex(): number | null {
        if(this._currentAnimationName in this.animationByName)
            return this.animationByName[this._currentAnimationName].currentFrameIndex;
        return null;
    }

    constructor(
        private readonly world: World,
        public readonly imageName: string,
        public readonly wFrame: number,
        public readonly hFrame: number,
    ) {}

    get isCurrentAnimationFinished(): boolean {
        if(!(this._currentAnimationName in this.animationByName))
            return false;
        return this.animationByName[this._currentAnimationName].finished;
    }

    addAnimation(animationName: string, animation: SpriteAnimation): this {
        this.animationByName[animationName] = animation;
        return this;
    }

    // forceChange = restart the animation if it's already the animation that's playing
    setAnimation(animationName: string, forceChange=false): this {
        if(!forceChange && animationName === this._currentAnimationName)
            return this;
        
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].reset();
        this._currentAnimationName = animationName;
        return this;
    }

    resetCurrentAnimation(): this {
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].reset();
        return this;
    }

    update() {
        if(this._currentAnimationName in this.animationByName)
            this.animationByName[this._currentAnimationName].update(this.world.delta);
    }

    draw(position: IPoint,
        scale: IPoint=Geometry.Point.One,
        angle: number=0,
        center?:IPoint,
        alpha:number=1,
        cameraContext: ImagesCameraContext=this.world,
    ) {
        if(this._currentAnimationName in this.animationByName) {
            const animation = this.animationByName[this._currentAnimationName];
            const currentIndices = animation.currentIndices;
            this.drawFrame(position, currentIndices.x, currentIndices.y, scale, angle, center, alpha, cameraContext);
        } else if(this._currentAnimationName == null) {
            this.drawFrame(position, 0, 0, Geometry.Point.One, 0, undefined, 1, cameraContext);
        }
    }

    private drawFrame(
        position: IPoint,
        xIndex: number,
        yIndex: number,
        scale: IPoint=Geometry.Point.One,
        angle: number=0,
        center?:IPoint,
        alpha:number=1,
        cameraContext: ImagesCameraContext=this.world,
    ) {
        Draw.imagePart(
            cameraContext,
            this.imageName,
            position,
            xIndex * this.wFrame,
            yIndex * this.hFrame,
            this.wFrame,
            this.hFrame,
            scale,
            angle,
            center,
            alpha
        );
    }
}