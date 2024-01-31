import { Geometry } from '../geometry/geometry';
import { IPoint } from '../geometry/interfaces';
import { Point } from '../geometry/point';
import { IComponent } from './component';
import { NamedClass } from './named';
import { World } from './world';

export abstract class Entity {
  public readonly id: number;
  public abstract get name(): string;

  public destroyed: boolean = false;
  public removed: boolean = false;
  public active: boolean = true;
  public visible: boolean = true;
  public depth: number = 0;

  public readonly componentsByName: { [name: string]: Set<IComponent> } = {};

  public readonly position: Point = new Point();

  constructor(public readonly world: World, position: IPoint = Geometry.Point.Zero) {
    this.id = this.world.addEntity(this);
    this.position.x = position.x;
    this.position.y = position.y;
  }

  public toString(): string {
    return JSON.stringify({
      name: this.name,
      id: this.id,
      position: this.position.toString(),
    });
  }

  public addComponent(component: IComponent) {
    component.entity = this;
    component.removed = false;

    if (!this.componentsByName[component.name]) this.componentsByName[component.name] = new Set();
    this.componentsByName[component.name].add(component);
  }

  public removeComponent(component: IComponent) {
    if (component.entity != this || component.removed) return;
    if (component.remove) component.remove();
    component.removed = true;
    component.entity = null;

    const classComponents = this.componentsByName[component.name];
    classComponents.delete(component);
    if (classComponents.size <= 0) delete this.componentsByName[component.name];
  }

  public removeAllComponents() {
    for (let _class in this.componentsByName) {
      const components = this.componentsByName[_class];
      for (let component of components) this.removeComponent(component);
    }
  }

  public componentsOfClass<T extends NamedClass<U>, U extends IComponent>(_class: T): Set<InstanceType<T>> | undefined {
    return this.componentsByName[_class.Name] as Set<InstanceType<T>>;
  }

  // sets this entity up to be removed from the World the next time
  // entities have finished updating but haven't yet drawn to the screen
  public destroy(): void {
    this.world.destroyEntity(this);
  }

  // call to remove the entity without destroying it (i.e. in the case of loading/unloading)
  public queueRemove(): void {
    this.world.queueRemoveEntity(this);
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
