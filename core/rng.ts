export class RNG {
  private _seed: number;
  public get seed(): number {
    return this._seed;
  }
  private seedCurrent: number;

  constructor(seed?: number) {
    this.initialize(seed);
  }

  initialize(seed?: number) {
    this.seedCurrent = this._seed = seed ?? Math.random();
  }

  reset() {
    this.seedCurrent = this.seed;
  }

  random(): number {
    this.seedCurrent = Math.sin(this.seedCurrent) * 10000;
    return this.seedCurrent - Math.floor(this.seedCurrent);
  }

  randomSign(includeZero: boolean = false): number {
    const value = this.random();
    return includeZero ? (value >= 0.6666666 ? 1 : value >= 0.3333333 ? -1 : 0) : value >= 0.5 ? 1 : -1;
  }

  randomRange(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  randomChoice<const T extends readonly any[]>(...options: T): T[number] {
    return options.sample(this) as T;
  }
}
