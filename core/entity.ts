import { World } from './world';
import { Point } from '@engine-ts/geometry/point';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { Geometry } from '@engine-ts/geometry/geometry';
import { IComponent } from './component';

export class Entity {
    public readonly id: number;
    public get class(): string { return this.constructor.name; }
    public static get Class(): string { return this.name; }

    public destroyed: boolean = false;
    public removed: boolean = false;
    public active: boolean = true;
    public visible: boolean = true;
    public depth: number = 0;

    public readonly components: { [_class: string]: IComponent[] } = {};

    public readonly position: Point = new Point();

    constructor(public readonly world: World, position: IPoint=Geometry.Point.Zero) {
        this.id = this.world.addEntity(this);
        this.position.x = position.x;
        this.position.y = position.y;
    }

    public toString(): string { 
        return JSON.stringify({ 
            class: this.class, 
            id: this.id, 
            position: this.position.toString()
        })
    }

    public addComponent(component: IComponent) {
        if(!this.components[component.class])
            this.components[component.class] = [];
        this.components[component.class].push(component);
    }

    private _handleRemoveComponent(component: IComponent) {
        if(component.entity != this || component.removed)
            return;
        if(component.remove)
            component.remove();
        component.removed = true;
        component.entity = null;
    }

    public removeComponent(component: IComponent) {
        this._handleRemoveComponent(component);

        const classComponents = this.components[component.class];
        classComponents.remove(component);
        if(classComponents.length <= 0)
            delete this.components[component.class];
    }

    public removeAllComponents() {
        for(let _class in this.components) {
            const components = this.components[_class];
            for(let i = components.length - 1; i >= 0; i--)
                this._handleRemoveComponent(components[i]);
            delete this.components[_class];
        }
    }
    
    public componentsOfClass<T extends new (...args: any[]) => U, U extends IComponent>(_class: T): InstanceType<T>[] {
        return this.components[_class.name] as InstanceType<T>[];
    }

    // sets this entity up to be removed from the World the next time
    // entities have finished updating but haven't yet drawn to the screen
    public destroy(): void {
        this.world.destroyEntity(this);
    }


    /* Handlers */

    // called by World when entity is removed from the world
    public remove(): void {}

    // called by World each frame
    public update(): void {}

    // called by World each frame after all entities have had their .update() called
    public postUpdate(): void {}

    // called by World each frame after all updates and after removing all destroyed entities
    public draw(): void {}
}