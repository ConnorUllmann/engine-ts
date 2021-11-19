import { World } from './world';
import { Point } from '../geometry/point';
import { IPoint } from '../geometry/interfaces';
import { Geometry } from '../geometry/geometry';
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

    public readonly componentsByClass: { [_class: string]: Set<IComponent> } = {};

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
        component.entity = this;
        component.removed = false;

        if(!this.componentsByClass[component.class])
            this.componentsByClass[component.class] = new Set();
        this.componentsByClass[component.class].add(component);
    }

    public removeComponent(component: IComponent) {
        if(component.entity != this || component.removed)
            return;
        if(component.remove)
            component.remove();
        component.removed = true;
        component.entity = null;

        const classComponents = this.componentsByClass[component.class];
        classComponents.delete(component);
        if(classComponents.size <= 0)
            delete this.componentsByClass[component.class];
    }

    public removeAllComponents() {
        for(let _class in this.componentsByClass) {
            const components = this.componentsByClass[_class];
            for(let component of components)
                this.removeComponent(component);
        }
    }
    
    public componentsOfClass<T extends new (...args: any[]) => U, U extends IComponent>(_class: T): Set<InstanceType<T>> | undefined {
        return this.componentsByClass[_class.name] as Set<InstanceType<T>>;
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