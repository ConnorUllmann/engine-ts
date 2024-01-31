import { Entity } from './entity';

/**
 * Mixin for naming entity classes. Names should be unique to the class.
 * @param name The name for the class
 * @param Base The class to extend
 * @returns A new class based on the existing class with a "name" property and a static "Name" property.
 * @example ```typescript
 * class MyEntity extends Named('MyEntity', Entity) {}
 *
 * // Enables this behavior
 * declare const world: World;
 * const entities = world.entitiesOfClass(MyEntity);
 * ```
 */
export function Named<U extends string, T extends abstract new (...args: any[]) => any>(name: U, Base: T) {
  abstract class Temp extends Base {
    public static readonly Name = name;
    public readonly name = name;
  }
  return Temp;
}

export type NamedClass<T> = ReturnType<typeof Named<any, new (...args: any[]) => T>>;
export type NamedEntity<T extends Entity = Entity> = NamedClass<T>;
