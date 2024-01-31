import { Entity } from './entity';

export interface IComponent {
  readonly name: string;
  entity: Entity | null;
  active: boolean;
  removed: boolean;
  update?: () => any;
  remove?: () => any;
}

export abstract class Component implements IComponent {
  public abstract readonly name: string;
  public active: boolean = true;
  public removed: boolean = false;
  public entity: Entity | null = null;
  constructor() {}
}
