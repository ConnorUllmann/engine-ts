import { Entity } from "./entity";

export interface IComponent {
    class: string,
    entity: Entity,
    active: boolean,
    removed: boolean
    update?: () => any,
    render?: () => any,
    remove?: () => any,
}

export abstract class Component implements IComponent {
    public get class(): string { return this.constructor.name; }
    public active: boolean = true;
    public removed: boolean = false;
    constructor(public readonly entity: Entity) {}
}