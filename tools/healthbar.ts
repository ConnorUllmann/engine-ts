import { clamp } from '../core/utils';

export class Healthbar {
  public onHeal: null | ((healAmount: number) => void) = null;
  private _onHeal(healAmount: number) {
    if (healAmount > 0 && this.onHeal) this.onHeal(healAmount);
  }

  public get isDead(): boolean {
    return this.health <= 0;
  }

  public get normal(): number {
    return clamp(this.health / this.healthMax, 0, 1);
  }
  public set normal(_normal: number) {
    const healthBefore = this._health;
    this._health = this._healthMax * _normal;
    this.capHealth();
    this._onHeal(this._health - healthBefore);
  }

  public get health(): number {
    return this._health;
  }
  public set health(_health: number) {
    const healthBefore = this._health;
    this._health = _health;
    this.capHealth();
    this._onHeal(this._health - healthBefore);
  }

  public get healthMax(): number {
    return this._healthMax;
  }
  public set healthMax(_healthMax: number) {
    this._healthMax = _healthMax;
    this.capHealth();
  }

  constructor(private _healthMax: number, private _health: number = _healthMax) {
    this.capHealth();
  }

  public hit(damage: number) {
    this._health -= Math.max(0, damage);
    this.capHealth();
  }

  public heal(healAmount: number) {
    const healthBefore = this._health;
    this._health += healAmount;
    this.capHealth();
    this._onHeal(this._health - healthBefore);
  }

  public fullHeal() {
    const healthBefore = this._health;
    this._health = this.healthMax;
    this._onHeal(this._health - healthBefore);
  }

  private capHealth() {
    this._health = clamp(this._health, 0, this.healthMax);
  }
}
