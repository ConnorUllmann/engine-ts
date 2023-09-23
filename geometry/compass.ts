import {
  angle135,
  angle180,
  angle225,
  angle270,
  angle315,
  angle45,
  angle90,
  enumToList,
  moduloSafe,
  tau,
} from '../core/utils';
import { Geometry } from './geometry';
import { IPoint } from './interfaces';

// ordered in increasing angle order starting from zero
export enum CompassDirection {
  E = 1 << 0,
  SE = 1 << 1,
  S = 1 << 2,
  SW = 1 << 3,
  W = 1 << 4,
  NW = 1 << 5,
  N = 1 << 6,
  NE = 1 << 7,
}

export const PointByCompassDirection = {
  [CompassDirection.E]: Geometry.Point.Right,
  [CompassDirection.NE]: Geometry.Point.Add(Geometry.Point.Right, Geometry.Point.Up),
  [CompassDirection.N]: Geometry.Point.Up,
  [CompassDirection.NW]: Geometry.Point.Add(Geometry.Point.Up, Geometry.Point.Left),
  [CompassDirection.W]: Geometry.Point.Left,
  [CompassDirection.SW]: Geometry.Point.Add(Geometry.Point.Left, Geometry.Point.Down),
  [CompassDirection.S]: Geometry.Point.Down,
  [CompassDirection.SE]: Geometry.Point.Add(Geometry.Point.Down, Geometry.Point.Right),
} as const satisfies Record<CompassDirection, IPoint>;

export const AngleByCompassDirection = {
  [CompassDirection.E]: 0,
  [CompassDirection.SE]: angle45,
  [CompassDirection.S]: angle90,
  [CompassDirection.SW]: angle135,
  [CompassDirection.W]: angle180,
  [CompassDirection.NW]: angle225,
  [CompassDirection.N]: angle270,
  [CompassDirection.NE]: angle315,
} as const satisfies Record<CompassDirection, number>;

export const InverseByCompassDirection = {
  [CompassDirection.E]: CompassDirection.W,
  [CompassDirection.NE]: CompassDirection.SW,
  [CompassDirection.N]: CompassDirection.S,
  [CompassDirection.NW]: CompassDirection.SE,
  [CompassDirection.W]: CompassDirection.E,
  [CompassDirection.SW]: CompassDirection.NE,
  [CompassDirection.S]: CompassDirection.N,
  [CompassDirection.SE]: CompassDirection.NW,
} as const satisfies Record<CompassDirection, CompassDirection>;

export const Clockwise90DegByCompassDirection = {
  [CompassDirection.E]: CompassDirection.S,
  [CompassDirection.NE]: CompassDirection.SE,
  [CompassDirection.N]: CompassDirection.E,
  [CompassDirection.NW]: CompassDirection.NE,
  [CompassDirection.W]: CompassDirection.N,
  [CompassDirection.SW]: CompassDirection.NW,
  [CompassDirection.S]: CompassDirection.W,
  [CompassDirection.SE]: CompassDirection.SW,
} as const satisfies Record<CompassDirection, CompassDirection>;

export const CounterClockwise90DegByCompassDirection = {
  [CompassDirection.E]: CompassDirection.N,
  [CompassDirection.NE]: CompassDirection.NW,
  [CompassDirection.N]: CompassDirection.W,
  [CompassDirection.NW]: CompassDirection.SW,
  [CompassDirection.W]: CompassDirection.S,
  [CompassDirection.SW]: CompassDirection.SE,
  [CompassDirection.S]: CompassDirection.E,
  [CompassDirection.SE]: CompassDirection.NE,
} as const satisfies Record<CompassDirection, CompassDirection>;

export function CompassDirectionAngleTo(directionTo: CompassDirection, directionFrom: CompassDirection): number {
  const angleTo = AngleByCompassDirection[directionTo];
  const angleFrom = AngleByCompassDirection[directionFrom];
  return Geometry.AngleDifference(angleTo, angleFrom);
}

export enum CompassDirectionGroup {
  CARDINAL,
  INTERCARDINAL,
  ALL,
}
export const CompassDirectionGroups = enumToList(CompassDirectionGroup);
export const IndexByCompassDirectionGroup = CompassDirectionGroups.reduce((acc, compassDirectionGroup, index) => {
  acc[compassDirectionGroup] = index;
  return acc;
}, {} as Record<CompassDirectionGroup, number>);

export const CompassDirectionsByGroup = {
  [CompassDirectionGroup.CARDINAL]: [CompassDirection.E, CompassDirection.S, CompassDirection.W, CompassDirection.N],
  [CompassDirectionGroup.INTERCARDINAL]: [
    CompassDirection.SE,
    CompassDirection.SW,
    CompassDirection.NW,
    CompassDirection.NE,
  ],
  [CompassDirectionGroup.ALL]: [
    CompassDirection.E,
    CompassDirection.SE,
    CompassDirection.S,
    CompassDirection.SW,
    CompassDirection.W,
    CompassDirection.NW,
    CompassDirection.N,
    CompassDirection.NE,
  ],
} as const satisfies {
  readonly [key in CompassDirectionGroup]: readonly CompassDirection[];
};

export const CardinalCompassDirections = CompassDirectionsByGroup[CompassDirectionGroup.CARDINAL];
export const IntercardinalCompassDirections = CompassDirectionsByGroup[CompassDirectionGroup.INTERCARDINAL];
export const CompassDirections = CompassDirectionsByGroup[CompassDirectionGroup.ALL];
export const IndexByCompassDirection = CompassDirections.reduce((acc, compassDirection, index) => {
  acc[compassDirection] = index;
  return acc;
}, {} as Record<CompassDirection, number>);

export type CardinalCompassDirection = (typeof CompassDirectionsByGroup)[CompassDirectionGroup.CARDINAL][number];
export type IntercardinalCompassDirection =
  (typeof CompassDirectionsByGroup)[CompassDirectionGroup.INTERCARDINAL][number];

const CardinalCompassDirectionSet = new Set(CompassDirectionsByGroup[CompassDirectionGroup.CARDINAL]);
const IntercardinalCompassDirectionSet = new Set(CompassDirectionsByGroup[CompassDirectionGroup.INTERCARDINAL]);

export const isCompassDirectionCardinal = (
  compassDirection: CompassDirection
): compassDirection is CardinalCompassDirection => {
  return CardinalCompassDirectionSet.has(compassDirection as any);
};
export const isCompassDirectionIntercardinal = (
  compassDirection: CompassDirection
): compassDirection is IntercardinalCompassDirection => {
  return IntercardinalCompassDirectionSet.has(compassDirection as any);
};

const CompassDirectionsByCardinality = {
  [CompassDirection.E]: [CompassDirection.NE, CompassDirection.E, CompassDirection.SE],
  [CompassDirection.S]: [CompassDirection.SE, CompassDirection.S, CompassDirection.SW],
  [CompassDirection.W]: [CompassDirection.SW, CompassDirection.W, CompassDirection.NW],
  [CompassDirection.N]: [CompassDirection.NW, CompassDirection.N, CompassDirection.NE],
} as const satisfies Readonly<Record<CardinalCompassDirection, Readonly<CompassDirection[]>>>;
export const HasCardinalComponent = (
  compassDirection: CompassDirection,
  cardinalComponent: CardinalCompassDirection
): boolean => {
  const compassDirections: Readonly<CompassDirection[]> = CompassDirectionsByCardinality[cardinalComponent];
  return compassDirections.includes(compassDirection);
};

export const CompassDirectionByPointByGroup = {
  [CompassDirectionGroup.CARDINAL]: (x: number, y: number) => {
    const isXGreaterThanY = Math.abs(x) > Math.abs(y);
    return isXGreaterThanY
      ? Math.sign(x) > 0
        ? CompassDirection.E
        : CompassDirection.W
      : Math.sign(y) > 0
      ? CompassDirection.S
      : CompassDirection.N;
  },
  [CompassDirectionGroup.INTERCARDINAL]: (x: number, y: number) => {
    const isEast = x >= 0;
    const isSouth = y >= 0;
    return isEast && isSouth
      ? CompassDirection.SE
      : isEast
      ? CompassDirection.NE
      : isSouth
      ? CompassDirection.SW
      : CompassDirection.NW;
  },
  [CompassDirectionGroup.ALL]: (x: number, y: number) =>
    CompassDirectionByAngleByGroup[CompassDirectionGroup.ALL](Geometry.Angle(x, y)),
} as const satisfies Record<CompassDirectionGroup, (x: number, y: number) => CompassDirection>;

export const CompassDirectionByAngleByGroup = {
  [CompassDirectionGroup.CARDINAL]: (angle: number) => {
    angle = moduloSafe(angle, tau);
    return angle < angle45 || angle >= angle315
      ? CompassDirection.E
      : angle < angle135
      ? CompassDirection.S
      : angle < angle225
      ? CompassDirection.W
      : CompassDirection.N;
  },
  [CompassDirectionGroup.INTERCARDINAL]: (angle: number) => {
    angle = moduloSafe(angle, tau);
    return angle < angle90 && angle >= 0
      ? CompassDirection.SE
      : angle < angle180
      ? CompassDirection.SW
      : angle < angle270
      ? CompassDirection.NW
      : CompassDirection.NE;
  },
  [CompassDirectionGroup.ALL]: (angle: number) => {
    // add 0.5 here because 0deg is in the middle of the "east" angle range
    const index = Math.floor(moduloSafe((angle / tau) * CompassDirections.length + 0.5, CompassDirections.length));
    return CompassDirections[index];
  },
} as const satisfies Record<CompassDirectionGroup, (angle: number) => CompassDirection>;

export const GetClosestValidCompassDirection = (
  point: IPoint,
  ...validDirections: CompassDirection[]
): CompassDirection | null => {
  const angle = Geometry.Angle(point.x, point.y);
  const minDirection =
    validDirections.minOf(direction => Math.abs(Geometry.AngleDifference(AngleByCompassDirection[direction], angle))) ??
    null;
  return minDirection;
};
