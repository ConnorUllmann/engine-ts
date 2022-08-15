import { enumToList } from '../core/utils';
import {
  ICircle,
  ILine,
  IPath,
  IPoint,
  IPolygon,
  IRay,
  IRectangle,
  ISegment,
  ITriangle,
  PointPairType,
} from './interfaces';

export enum ShapeType {
  Rectangle,
  Circle,
  Triangle,
  Polygon,
  Path,
  Segment,
  Ray,
  Line,
  Point,
}
export const ShapeTypes = enumToList(ShapeType);

export type BoundableShape = IPoint | ITriangle | IRectangle | ICircle | IPolygon | IPath | ISegment;
export type Shape = BoundableShape | IRay | ILine;

type ShapeByShapeType = {
  [ShapeType.Rectangle]: IRectangle;
  [ShapeType.Circle]: ICircle;
  [ShapeType.Triangle]: ITriangle;
  [ShapeType.Polygon]: IPolygon;
  [ShapeType.Path]: IPath;
  [ShapeType.Segment]: ISegment;
  [ShapeType.Ray]: IRay;
  [ShapeType.Line]: ILine;
  [ShapeType.Point]: IPoint;
};

const TypeGuardByShapeType: { [key in ShapeType]: (o: any) => o is ShapeByShapeType[key] } = {
  [ShapeType.Rectangle]: (o: any): o is IRectangle => o.x != null && o.y != null && o.w != null && o.h != null,
  [ShapeType.Circle]: (o: any): o is ICircle => o.x != null && o.y != null && o.r != null,
  [ShapeType.Triangle]: (o: any): o is ITriangle => o.a != null && o.b != null && o.c != null,
  [ShapeType.Polygon]: (o: any): o is IPolygon => o.vertices != null,
  [ShapeType.Path]: (o: any): o is IPath => Array.isArray(o),
  // if the "type" field is omitted from a PointPair, it is treated as a Segment by default
  [ShapeType.Segment]: (o: any): o is ISegment =>
    o.a != null && o.b != null && (o.type == null || o.type == PointPairType.SEGMENT),
  [ShapeType.Ray]: (o: any): o is IRay => o.a != null && o.b != null && o.type == PointPairType.RAY,
  [ShapeType.Line]: (o: any): o is ILine => o.a != null && o.b != null && o.type == PointPairType.LINE,
  [ShapeType.Point]: (o: any): o is IPoint => o.x != null && o.y != null && o.w === undefined && o.r === undefined,
};

export const IsRectangle = TypeGuardByShapeType[ShapeType.Rectangle];
export const IsCircle = TypeGuardByShapeType[ShapeType.Circle];
export const IsTriangle = TypeGuardByShapeType[ShapeType.Triangle];
export const IsPolygon = TypeGuardByShapeType[ShapeType.Polygon];
export const IsPath = TypeGuardByShapeType[ShapeType.Path];
export const IsLine = TypeGuardByShapeType[ShapeType.Line];
export const IsRay = TypeGuardByShapeType[ShapeType.Ray];
export const IsSegment = TypeGuardByShapeType[ShapeType.Segment];
export const IsPoint = TypeGuardByShapeType[ShapeType.Point];
