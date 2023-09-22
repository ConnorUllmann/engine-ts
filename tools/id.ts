/**
 * Branded ID generator. Creates ID types that are primitives but which are unassignable to one another.
 */
export type Id<IdType extends PropertyKey, IdName extends string> = IdType & {
  __brand?: IdName;
};
