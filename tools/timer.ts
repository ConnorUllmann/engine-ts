import { clamp, moduloSafe } from '../core/utils';

export interface TimerState {
  value: number;
  seconds: number;
  triggered: boolean;
  started: boolean;
  paused: boolean;
  loop: boolean;
}

export class Timer {
  public value: number = 0;
  public triggered: boolean = false; // whether or not the timer's value has crossed over 1 this frame
  public started: boolean = false; // whether or not the timer has had its .update() method called at least once
  public paused: boolean = false;

  protected clean(valueRaw: number): number {
    return this.loop ? moduloSafe(valueRaw, 1) : clamp(valueRaw, 0, 1);
  }

  public get finished(): boolean {
    return this.loop ? false : this.value >= 1;
  }
  public toRange(min: number, max: number) {
    return (max - min) * this.value + min;
  }

  public get milliseconds(): number {
    return this.seconds * 1000;
  }

  public get millisecondsRemaining(): number {
    return this.milliseconds * (1 - this.value);
  }

  public get secondsRemaining(): number {
    return this.seconds * (1 - this.value);
  }

  constructor(public seconds: number = 1, public loop = false) {}

  public fromState(state: TimerState) {
    this.value = state.value;
    this.seconds = state.seconds;
    this.triggered = state.triggered;
    this.started = state.started;
    this.paused = state.paused;
    this.loop = state.loop;
    return this;
  }

  public getState(): TimerState {
    return {
      value: this.value,
      seconds: this.seconds,
      triggered: this.triggered,
      started: this.started,
      paused: this.paused,
      loop: this.loop,
    };
  }

  public finish(): this {
    this.value = 1;
    return this;
  }

  public reset(seconds: number = this.seconds): this {
    this.seconds = seconds;
    this.value = this.seconds === 0 ? 1 : 0;
    this.triggered = false;
    this.started = false;
    this.paused = false;
    return this;
  }

  // deltaMs == world.delta
  public update(deltaMs: number): this {
    if (this.paused) return this;
    const valueLast = this.value;
    const valueNext = this.seconds > 0 ? this.value + deltaMs / 1000 / this.seconds : 1;
    this.value = this.clean(valueNext);
    this.triggered =
      deltaMs > 0 ? valueNext >= 1 && valueLast < 1 : deltaMs < 0 ? valueLast > 0 && valueNext <= 0 : false;
    this.started = true;
    return this;
  }
}

/**
 * @deprecated Use `Timer` instead but pass `true` for the `loop` parameter
 */
export class LoopTimer extends Timer {
  constructor(public seconds: number = 1) {
    super(seconds, true);
  }
}
