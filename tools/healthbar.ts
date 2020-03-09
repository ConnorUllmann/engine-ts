import { clamp } from '@engine-ts/core/utils';

export class Healthbar {
    public get normal(): number { return clamp(this.health / this.healthMax, 0, 1); }
    public get isDead(): boolean { return this.health <= 0; }
    public get health(): number { return this._health; }

    constructor(public healthMax: number, private _health: number=healthMax) {}

    public hit(damage: number) {
        this._health -= damage;
        if(this._health <= 0) {
            this._health = 0;
        }
    }
}