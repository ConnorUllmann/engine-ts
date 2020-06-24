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
    SE
}

export const PointByCompassDirection: { [key in CompassDirection]: IPoint } = {
    [CompassDirection.E]: Geometry.Point.Right,
    [CompassDirection.NE]: Geometry.Point.Add(Geometry.Point.Right, Geometry.Point.Up),
    [CompassDirection.N]: Geometry.Point.Up,
    [CompassDirection.NW]: Geometry.Point.Add(Geometry.Point.Up, Geometry.Point.Left),
    [CompassDirection.W]: Geometry.Point.Left,
    [CompassDirection.SW]: Geometry.Point.Add(Geometry.Point.Left, Geometry.Point.Down),
    [CompassDirection.S]: Geometry.Point.Down,
    [CompassDirection.SE]: Geometry.Point.Add(Geometry.Point.Down, Geometry.Point.Right),
}

export enum CompassDirectionGroup {
    CARDINAL,
    INTERCARDINAL,
    ALL
}

export const CompassDirectionsByGroup: { [key in CompassDirectionGroup]: CompassDirection[] } = {
    [CompassDirectionGroup.CARDINAL]: [
        CompassDirection.E,
        CompassDirection.N,
        CompassDirection.W,
        CompassDirection.S
    ],
    [CompassDirectionGroup.INTERCARDINAL]: [
        CompassDirection.NE,
        CompassDirection.NW,
        CompassDirection.SW,
        CompassDirection.SE
    ],
    [CompassDirectionGroup.ALL]: [
        CompassDirection.E,
        CompassDirection.NE,
        CompassDirection.N,
        CompassDirection.NW,
        CompassDirection.W,
        CompassDirection.SW,
        CompassDirection.S,
        CompassDirection.SE
    ],
}