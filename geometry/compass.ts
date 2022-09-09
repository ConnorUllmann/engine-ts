import { enumToList, moduloSafe, tau } from '../core/utils';
import { Geometry } from './geometry';
import { IPoint } from './interfaces';

export enum CompassDirection {
  E,
  NE,
  N,
  NW,
  W,
  SW,
  S,
  SE,
}
export const CompassDirections = enumToList(CompassDirection);
const IndexByCompassDirection = CompassDirections.reduce((acc, compassDirection, index) => {
  acc[compassDirection] = index;
  return acc;
}, {} as Record<CompassDirection, number>);

export const PointByCompassDirection: { [key in CompassDirection]: IPoint } = {
  [CompassDirection.E]: Geometry.Point.Right,
  [CompassDirection.NE]: Geometry.Point.Add(Geometry.Point.Right, Geometry.Point.Up),
  [CompassDirection.N]: Geometry.Point.Up,
  [CompassDirection.NW]: Geometry.Point.Add(Geometry.Point.Up, Geometry.Point.Left),
  [CompassDirection.W]: Geometry.Point.Left,
  [CompassDirection.SW]: Geometry.Point.Add(Geometry.Point.Left, Geometry.Point.Down),
  [CompassDirection.S]: Geometry.Point.Down,
  [CompassDirection.SE]: Geometry.Point.Add(Geometry.Point.Down, Geometry.Point.Right),
};

export const InverseByCompassDirection: { [key in CompassDirection]: CompassDirection } = {
  [CompassDirection.E]: CompassDirection.W,
  [CompassDirection.NE]: CompassDirection.SW,
  [CompassDirection.N]: CompassDirection.S,
  [CompassDirection.NW]: CompassDirection.SE,
  [CompassDirection.W]: CompassDirection.E,
  [CompassDirection.SW]: CompassDirection.NE,
  [CompassDirection.S]: CompassDirection.N,
  [CompassDirection.SE]: CompassDirection.NW,
};

export const Clockwise90DegByCompassDirection: { [key in CompassDirection]: CompassDirection } = {
  [CompassDirection.E]: CompassDirection.S,
  [CompassDirection.NE]: CompassDirection.SE,
  [CompassDirection.N]: CompassDirection.E,
  [CompassDirection.NW]: CompassDirection.NE,
  [CompassDirection.W]: CompassDirection.N,
  [CompassDirection.SW]: CompassDirection.NW,
  [CompassDirection.S]: CompassDirection.W,
  [CompassDirection.SE]: CompassDirection.SW,
};

export const CounterClockwise90DegByCompassDirection: { [key in CompassDirection]: CompassDirection } = {
  [CompassDirection.E]: CompassDirection.N,
  [CompassDirection.NE]: CompassDirection.NW,
  [CompassDirection.N]: CompassDirection.W,
  [CompassDirection.NW]: CompassDirection.SW,
  [CompassDirection.W]: CompassDirection.S,
  [CompassDirection.SW]: CompassDirection.SE,
  [CompassDirection.S]: CompassDirection.E,
  [CompassDirection.SE]: CompassDirection.NE,
};

export enum CompassDirectionGroup {
  CARDINAL,
  INTERCARDINAL,
  ALL,
}

export const CompassDirectionsByGroup: {
  [key in CompassDirectionGroup]: CompassDirection[];
} = {
  [CompassDirectionGroup.CARDINAL]: [CompassDirection.E, CompassDirection.N, CompassDirection.W, CompassDirection.S],
  [CompassDirectionGroup.INTERCARDINAL]: [
    CompassDirection.NE,
    CompassDirection.NW,
    CompassDirection.SW,
    CompassDirection.SE,
  ],
  [CompassDirectionGroup.ALL]: [
    CompassDirection.E,
    CompassDirection.NE,
    CompassDirection.N,
    CompassDirection.NW,
    CompassDirection.W,
    CompassDirection.SW,
    CompassDirection.S,
    CompassDirection.SE,
  ],
};

const CardinalCompassDirectionSet = new Set(CompassDirectionsByGroup[CompassDirectionGroup.CARDINAL]);
const IntercardinalCompassDirectionSet = new Set(CompassDirectionsByGroup[CompassDirectionGroup.INTERCARDINAL]);

export const isCompassDirectionCardinal = (compassDirection: CompassDirection): boolean => {
  return CardinalCompassDirectionSet.has(compassDirection);
};
export const isCompassDirectionIntercardinal = (compassDirection: CompassDirection): boolean => {
  return IntercardinalCompassDirectionSet.has(compassDirection);
};

export const CompassDirectionByPointByGroup: Record<CompassDirectionGroup, (x: number, y: number) => CompassDirection> =
  {
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
    [CompassDirectionGroup.ALL]: (x: number, y: number) => {
      const angle = Geometry.Angle(x, -y); // since (0, -1) is up which should be 90deg
      // add 0.5 here because 0deg is in the middle of the "east" angle range
      const index = Math.floor(moduloSafe((angle / tau) * CompassDirections.length + 0.5, CompassDirections.length));
      return CompassDirections[index];
    },
  };

export const GetClosestValidCompassDirection = (
  point: IPoint,
  ...validDirections: CompassDirection[]
): CompassDirection | null => {
  const minDirection =
    validDirections.minOf(direction =>
      Math.abs(
        Geometry.AngleDifference(
          ((IndexByCompassDirection[direction] - 0.5) / CompassDirections.length) * tau,
          Geometry.Angle(point.x, -point.y) // since (0, -1) is up which should be 90deg
        )
      )
    ) ?? null;
  return minDirection;
};
