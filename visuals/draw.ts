import { DeepReadonly, enumToList, tau } from '../core/utils';
import { Geometry } from '../geometry/geometry';
import {
  ICircle,
  ILine,
  IPoint,
  IPolygon,
  IRay,
  IRectangle,
  ISegment,
  ITriangle,
  PointPairType,
} from '../geometry/interfaces';
import {
  IsCircle,
  IsLine,
  IsPath,
  IsPoint,
  IsPolygon,
  IsRay,
  IsRectangle,
  IsSegment,
  IsTriangle,
  Shape,
} from '../geometry/shape-type';
import { Halign, Valign } from './align';
import { BlendMode } from './blend-mode';
import { CameraContext } from './camera-context';
import { Color } from './color';
import { ColorStopArray } from './color-stop-array';

export type FillStyle = DeepReadonly<Color> | string | null;
export type StrokeStyle = FillStyle;
export type HalignAll = Halign | 'start' | 'end';
export type ValignAll = Valign | 'hanging' | 'alphabetic' | 'ideographic';

export enum OutlinePlacement {
  FullyInner = 'FullyInner',
  FullyOuter = 'FullyOuter',
  InnerFirst = 'InnerFirst',
  OuterFirst = 'OuterFirst',
  Default = 'Default',
}
export const OutlinePlacements = enumToList(OutlinePlacement);

// TODO: remove world from this doc and instead create a world.draw property which has all these
// same functions and simply calls the below functions after applying the world's camera position, zoom level, etc.
export class Draw {
  static readonly Explicit = {
    // x/y refers to the top-left corner of the image in world space
    // xCenter/yCenter refers to the point in world space around which to rotate the image were it to be drawn at x/y
    Image: (
      { context, camera }: CameraContext,
      image: HTMLImageElement | null,
      x: number,
      y: number,
      xScale: number = 1,
      yScale: number = 1,
      angle: number = 0,
      xCenter?: number,
      yCenter?: number,
      alpha: number = 1
    ) => {
      if (!image) return;

      const w = Math.abs(xScale * (image.width as number));
      const h = Math.abs(yScale * (image.height as number));

      const globalAlphaPrevious = context.globalAlpha;
      context.globalAlpha = alpha;

      xCenter = xCenter == null ? x + w / 2 : xCenter;
      yCenter = yCenter == null ? y + h / 2 : yCenter;

      context.translate(xCenter - camera.x, yCenter - camera.y);
      if (angle !== 0) context.rotate(angle);
      context.scale(Math.sign(xScale), Math.sign(yScale));
      context.translate(x + w / 2 - xCenter, y + h / 2 - yCenter);
      context.drawImage(image, -w / 2, -h / 2, w, h);
      context.resetTransform();

      context.globalAlpha = globalAlphaPrevious;
    },

    // x/y refers to the top-left corner of the image in world space
    // xCenter/yCenter refers to the point in world space around which to rotate the image were it to be drawn at x/y
    ImagePart: (
      { context, camera }: CameraContext,
      image: HTMLImageElement | null,
      x: number,
      y: number,
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      xScale: number = 1,
      yScale: number = 1,
      angle: number = 0,
      xCenter?: number,
      yCenter?: number,
      alpha: number = 1
    ) => {
      if (!image) return;

      const w = Math.abs(xScale * sw);
      const h = Math.abs(yScale * sh);

      const globalAlphaPrevious = context.globalAlpha;
      context.globalAlpha = alpha;

      xCenter = xCenter == null ? x + w / 2 : xCenter;
      yCenter = yCenter == null ? y + h / 2 : yCenter;

      context.translate(xCenter - camera.x, yCenter - camera.y);
      if (angle !== 0) context.rotate(angle);
      context.scale(Math.sign(xScale), Math.sign(yScale));
      context.translate(x + w / 2 - xCenter, y + h / 2 - yCenter);
      context.drawImage(image, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
      context.resetTransform();

      context.globalAlpha = globalAlphaPrevious;
    },

    CircleArc: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      r: number,
      startAngle: number,
      endAngle: number,
      fillStyle: FillStyle = null
    ) => {
      if (r <= 0) return;
      context.beginPath();
      context.arc(x - camera.x, y - camera.y, r, startAngle, endAngle);
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);
      context.fill();
    },

    CircleArcOutline: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      r: number,
      startAngle: number,
      endAngle: number,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1,
      outlinePlacement: OutlinePlacement = OutlinePlacement.Default
    ) => {
      if (lineWidth <= 0) return;
      r = Draw.ApplyOutlinePlacement(r, lineWidth, outlinePlacement);
      context.beginPath();
      context.arc(x - camera.x, y - camera.y, r, startAngle, endAngle);
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.lineWidth = lineWidth;
      context.stroke();
    },

    Circle: (cameraContext: CameraContext, x: number, y: number, r: number, fillStyle: FillStyle = null) =>
      Draw.Explicit.CircleArc(cameraContext, x, y, r, 0, tau, fillStyle),

    CircleOutline: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      r: number,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1,
      outlinePlacement: OutlinePlacement = OutlinePlacement.Default
    ) => Draw.Explicit.CircleArcOutline(cameraContext, x, y, r, 0, tau, strokeStyle, lineWidth, outlinePlacement),

    CircleArcGradient: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      r: number,
      colorStopArray: DeepReadonly<ColorStopArray>,
      startAngle: number = 0,
      endAngle: number = tau,
      alpha: number = 1
    ) => {
      const globalAlphaPrevious = context.globalAlpha;
      context.globalAlpha = alpha;

      const xDiff = x - camera.x;
      const yDiff = y - camera.y;
      const gradient = context.createRadialGradient(xDiff, yDiff, 0, xDiff, yDiff, r);
      ColorStopArray.ApplyToGradient(colorStopArray, gradient);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x - camera.x, y - camera.y, r, startAngle, endAngle);
      context.fill();

      context.globalAlpha = globalAlphaPrevious;
    },

    CircleArcOutlineGradient: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      r: number,
      colorStopArray: DeepReadonly<ColorStopArray>,
      startAngle: number,
      endAngle: number,
      alpha: number = 1,
      lineWidth: number = 1,
      outlinePlacement: OutlinePlacement = OutlinePlacement.Default
    ) => {
      if (lineWidth <= 0) return;
      r = Draw.ApplyOutlinePlacement(r, lineWidth, outlinePlacement);
      if (r <= 0) return;

      const globalAlphaPrevious = context.globalAlpha;
      context.globalAlpha = alpha;

      const xDiff = x - camera.x;
      const yDiff = y - camera.y;
      const gradient = context.createRadialGradient(xDiff, yDiff, r - lineWidth / 2, xDiff, yDiff, r + lineWidth / 2);
      ColorStopArray.ApplyToGradient(colorStopArray, gradient);
      context.strokeStyle = gradient;
      context.beginPath();
      context.arc(x - camera.x, y - camera.y, r, startAngle, endAngle);
      context.lineWidth = lineWidth;
      context.stroke();

      context.globalAlpha = globalAlphaPrevious;
    },

    Ring: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      innerRadius: number,
      outerRadius: number,
      strokeStyle: StrokeStyle = null
    ) => {
      if (outerRadius < innerRadius) {
        const temp = outerRadius;
        outerRadius = innerRadius;
        innerRadius = temp;
      }
      if (outerRadius <= 0) return;
      const lineWidth = outerRadius - innerRadius;
      const r = (outerRadius + innerRadius) / 2;
      Draw.Explicit.CircleOutline(cameraContext, x, y, r, strokeStyle, lineWidth);
    },

    OvalArc: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      xRadius: number,
      yRadius: number,
      startAngle: number,
      endAngle: number,
      fillStyle: FillStyle = null,
      angle = 0,
      xCenter = x,
      yCenter = y
    ) => {
      if (xRadius <= 0 || yRadius <= 0) return;
      context.translate(xCenter - camera.x, yCenter - camera.y);
      context.rotate(angle);
      context.beginPath();
      context.ellipse(x - xCenter, y - yCenter, xRadius, yRadius, 0, startAngle, endAngle);
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);
      context.fill();
      context.resetTransform();
    },

    OvalArcOutline: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      xRadius: number,
      yRadius: number,
      startAngle: number,
      endAngle: number,
      strokeStyle: StrokeStyle = null,
      angle: number = 0,
      lineWidth: number = 1,
      outlinePlacement: OutlinePlacement = OutlinePlacement.Default
    ) => {
      xRadius = Draw.ApplyOutlinePlacement(xRadius, lineWidth, outlinePlacement);
      yRadius = Draw.ApplyOutlinePlacement(yRadius, lineWidth, outlinePlacement);
      if (xRadius <= 0 || yRadius <= 0) return;
      context.beginPath();
      context.ellipse(x - camera.x, y - camera.y, xRadius, yRadius, angle, startAngle, endAngle);
      context.lineWidth = lineWidth;
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.stroke();
    },

    Oval: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      xRadius: number,
      yRadius: number,
      fillStyle: FillStyle = null,
      angle = 0,
      xCenter = x,
      yCenter = y
    ) => Draw.Explicit.OvalArc(cameraContext, x, y, xRadius, yRadius, 0, tau, fillStyle, angle, xCenter, yCenter),

    OvalOutline: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      xRadius: number,
      yRadius: number,
      strokeStyle: StrokeStyle = null,
      angle: number = 0,
      lineWidth: number = 1,
      outlinePlacement: OutlinePlacement = OutlinePlacement.Default
    ) =>
      Draw.Explicit.OvalArcOutline(
        cameraContext,
        x,
        y,
        xRadius,
        yRadius,
        0,
        tau,
        strokeStyle,
        angle,
        lineWidth,
        outlinePlacement
      ),

    Triangle: (
      { context, camera }: CameraContext,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      cx: number,
      cy: number,
      fillStyle: FillStyle = null
    ) => {
      context.beginPath();
      context.moveTo(ax - camera.x, ay - camera.y);
      context.lineTo(bx - camera.x, by - camera.y);
      context.lineTo(cx - camera.x, cy - camera.y);
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);
      context.fill();
    },

    TriangleOutline: (
      { context, camera }: CameraContext,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      cx: number,
      cy: number,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1
    ) => {
      context.beginPath();
      context.moveTo(ax - camera.x, ay - camera.y);
      context.lineTo(bx - camera.x, by - camera.y);
      context.lineTo(cx - camera.x, cy - camera.y);
      context.closePath();
      context.lineWidth = lineWidth;
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.stroke();
    },

    Polygon: ({ context, camera }: CameraContext, vertices: DeepReadonly<IPoint[]>, fillStyle: FillStyle = null) => {
      const vertexFirst = vertices.first();
      if (vertexFirst == null) return;
      context.beginPath();
      context.moveTo(vertexFirst.x - camera.x, vertexFirst.y - camera.y);
      for (let i = 1; i < vertices.length; i++) context.lineTo(vertices[i].x - camera.x, vertices[i].y - camera.y);
      context.closePath();
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);
      context.fill();
    },

    PolygonOutline: (
      { context, camera }: CameraContext,
      vertices: DeepReadonly<IPoint[]>,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1
    ) => {
      const vertexFirst = vertices.first();
      if (vertexFirst == null) return;
      context.beginPath();
      context.moveTo(vertexFirst.x - camera.x, vertexFirst.y - camera.y);
      for (let i = 1; i < vertices.length; i++) context.lineTo(vertices[i].x - camera.x, vertices[i].y - camera.y);
      context.closePath();
      context.lineWidth = lineWidth;
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.stroke();
    },

    RegularPolygon: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      radius: number,
      sides: number,
      fillStyle: FillStyle = null,
      angle: number = 0
    ) => {
      if (sides <= 0 || radius <= 0) return;
      const { context } = cameraContext;
      context.beginPath();
      Draw.Explicit.AddRegularPolygonPointsToPath(cameraContext, x, y, radius, sides, angle);
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);
      context.fill();
    },

    RegularPolygonOutline: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      radius: number,
      sides: number,
      strokeStyle: StrokeStyle = null,
      angle: number = 0,
      lineWidth: number = 1
    ) => {
      if (sides <= 0 || radius <= 0) return;
      const { context } = cameraContext;
      context.beginPath();
      Draw.Explicit.AddRegularPolygonPointsToPath(cameraContext, x, y, radius, sides, angle);
      context.lineWidth = lineWidth;
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.closePath();
      context.stroke();
    },

    Rectangle: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      fillStyle: FillStyle = null,
      angle: number = 0,
      xCenter?: number,
      yCenter?: number
    ) => {
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);

      if (angle === 0) {
        context.fillRect(x - camera.x, y - camera.y, w, h);
        return;
      }

      const cx = (xCenter ?? x + w / 2) - camera.x;
      const cy = (yCenter ?? y + h / 2) - camera.y;
      context.translate(cx, cy);
      context.rotate(angle);
      context.fillRect(x - camera.x - cx, y - camera.y - cy, w, h);
      context.resetTransform();
    },

    RectangleOutline: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      strokeStyle: StrokeStyle = null,
      angle: number = 0,
      xCenter?: number,
      yCenter?: number,
      lineWidth: number = 1,
      outlinePlacement: OutlinePlacement = OutlinePlacement.InnerFirst
    ) => {
      const expand = Draw.ApplyOutlinePlacement(0, lineWidth, outlinePlacement);

      x -= expand;
      y -= expand;
      w += 2 * expand;
      h += 2 * expand;

      const xw = x + w;
      const yh = y + h;

      context.beginPath();
      if (angle !== 0) {
        xCenter = xCenter ?? x + w / 2;
        yCenter = yCenter ?? y + h / 2;
        context.moveTo(
          Geometry.RotateX(x, y, angle, xCenter, yCenter) - camera.x,
          Geometry.RotateY(x, y, angle, xCenter, yCenter) - camera.y
        );
        context.lineTo(
          Geometry.RotateX(xw, y, angle, xCenter, yCenter) - camera.x,
          Geometry.RotateY(xw, y, angle, xCenter, yCenter) - camera.y
        );
        context.lineTo(
          Geometry.RotateX(xw, yh, angle, xCenter, yCenter) - camera.x,
          Geometry.RotateY(xw, yh, angle, xCenter, yCenter) - camera.y
        );
        context.lineTo(
          Geometry.RotateX(x, yh, angle, xCenter, yCenter) - camera.x,
          Geometry.RotateY(x, yh, angle, xCenter, yCenter) - camera.y
        );
      } else {
        context.moveTo(x - camera.x, y - camera.y);
        context.lineTo(xw - camera.x, y - camera.y);
        context.lineTo(xw - camera.x, yh - camera.y);
        context.lineTo(x - camera.x, yh - camera.y);
      }
      context.closePath();
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.lineWidth = lineWidth;
      context.stroke();
    },

    RectangleGradientVertical: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      colorStopArray: DeepReadonly<ColorStopArray>
    ) => {
      const xDiff = x - camera.x;
      const yDiff = y - camera.y;
      const gradient = context.createLinearGradient(xDiff, yDiff, xDiff, yDiff + h);
      ColorStopArray.ApplyToGradient(colorStopArray, gradient);
      context.fillStyle = gradient;
      context.fillRect(xDiff, yDiff, w, h);
    },

    RectangleGradientHorizontal: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      colorStopArray: DeepReadonly<ColorStopArray>
    ) => {
      const xDiff = x - camera.x;
      const yDiff = y - camera.y;
      const gradient = context.createLinearGradient(xDiff, yDiff, xDiff + w, yDiff);
      ColorStopArray.ApplyToGradient(colorStopArray, gradient);
      context.fillStyle = gradient;
      context.fillRect(xDiff, yDiff, w, h);
    },

    RectangleRounded: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      fillStyle: FillStyle = null,
      angle = 0,
      xCenter?: number,
      yCenter?: number
    ) => {
      const { context } = cameraContext;
      context.beginPath();
      Draw.Explicit.AddRectangleRoundedToPath(
        cameraContext,
        x,
        y,
        w,
        h,
        radius,
        angle,
        xCenter,
        yCenter,
        1,
        OutlinePlacement.Default
      );
      if (fillStyle) context.fillStyle = Draw.StyleToString(fillStyle);
      context.fill();
    },

    RectangleRoundedOutline: (
      cameraContext: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      strokeStyle: StrokeStyle = null,
      angle: number = 0,
      xCenter?: number,
      yCenter?: number,
      lineWidth = 1,
      outlinePlacement = OutlinePlacement.InnerFirst
    ) => {
      const { context } = cameraContext;
      context.beginPath();
      Draw.Explicit.AddRectangleRoundedToPath(
        cameraContext,
        x,
        y,
        w,
        h,
        radius,
        angle,
        xCenter,
        yCenter,
        lineWidth,
        outlinePlacement
      );
      context.lineWidth = lineWidth;
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.stroke();
    },

    Line: (
      { context, camera }: CameraContext,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1
    ) => {
      if (lineWidth <= 0) return;

      const points = Geometry.IntersectionExplicit.RectanglePointPair(
        camera.x,
        camera.y,
        camera.w,
        camera.h,
        ax,
        ay,
        bx,
        by,
        PointPairType.LINE
      );
      if (points.length < 2) return;

      context.beginPath();
      context.moveTo(points[0].x - camera.x, points[0].y - camera.y);
      context.lineTo(points[1].x - camera.x, points[1].y - camera.y);
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.lineWidth = lineWidth;
      context.stroke();
    },

    Ray: (
      { context, camera }: CameraContext,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1
    ) => {
      if (lineWidth <= 0) return;

      const points = Geometry.IntersectionExplicit.RectanglePointPair(
        camera.x,
        camera.y,
        camera.w,
        camera.h,
        ax,
        ay,
        bx,
        by,
        PointPairType.RAY
      );
      if (points.length === 1) {
        context.beginPath();
        context.moveTo(ax - camera.x, ay - camera.y);
        context.lineTo(points[0].x - camera.x, points[0].y - camera.y);
        if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
        context.lineWidth = lineWidth;
        context.stroke();
        return;
      }

      if (points.length !== 2) return;

      context.beginPath();
      context.moveTo(points[0].x - camera.x, points[0].y - camera.y);
      context.lineTo(points[1].x - camera.x, points[1].y - camera.y);
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.lineWidth = lineWidth;
      context.stroke();
    },

    Segment: (
      { context, camera }: CameraContext,
      ax: number,
      ay: number,
      bx: number,
      by: number,
      strokeStyle: StrokeStyle = null,
      lineWidth: number = 1
    ) => {
      if (lineWidth <= 0) return;
      context.beginPath();
      context.moveTo(ax - camera.x, ay - camera.y);
      context.lineTo(bx - camera.x, by - camera.y);
      if (strokeStyle) context.strokeStyle = Draw.StyleToString(strokeStyle);
      context.lineWidth = lineWidth;
      context.stroke();
    },

    Text: (
      { context, camera }: CameraContext,
      text: string,
      x: number,
      y: number,
      fillStyle: FillStyle = null,
      font: string | null = null,
      halign: HalignAll = Halign.LEFT,
      valign: ValignAll = Valign.TOP,
      angle: number = 0,
      xCenter?: number,
      yCenter?: number
    ) => {
      Draw.TextStyle(context, fillStyle, font, halign, valign);
      if (angle !== 0) {
        xCenter = (xCenter ?? x + Draw.TextWidth(context, text) / 2) - camera.x;
        yCenter = (yCenter ?? y + Draw.TextHeight(context) / 2) - camera.y;
        context.translate(xCenter, yCenter);
        context.rotate(angle);
        context.fillText(text, x - camera.x - xCenter, y - camera.y - yCenter);
        context.resetTransform();
        return;
      }
      context.fillText(text, x - camera.x, y - camera.y);
    },

    AddRegularPolygonPointsToPath: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      radius: number,
      sides: number,
      angle: number
    ) => {
      for (let i = 0; i < sides; i++) {
        const angleToCorner = (tau * i) / sides + angle;
        const xCorner = radius * Math.cos(angleToCorner) + x - camera.x;
        const yCorner = radius * Math.sin(angleToCorner) + y - camera.y;
        if (i === 0) context.moveTo(xCorner, yCorner);
        else context.lineTo(xCorner, yCorner);
      }
    },

    AddRectangleRoundedToPath: (
      { context, camera }: CameraContext,
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
      angle: number,
      xCenter?: number,
      yCenter?: number,
      lineWidth = 1,
      outlinePlacement = OutlinePlacement.Default
    ) => {
      const outlinePlacementDiff = Draw.ApplyOutlinePlacement(0, lineWidth, outlinePlacement);
      radius += outlinePlacementDiff;
      x -= outlinePlacementDiff;
      y -= outlinePlacementDiff;
      w += 2 * outlinePlacementDiff;
      h += 2 * outlinePlacementDiff;

      xCenter = xCenter ?? x + w / 2;
      yCenter = yCenter ?? y + h / 2;
      context.translate(xCenter - camera.x, yCenter - camera.y);
      context.rotate(angle);

      const xRightHor = x + w - xCenter;
      const xRightVer = xRightHor - radius;
      const xLeftHor = x - xCenter;
      const xLeftVer = xLeftHor + radius;
      const yTopVer = y - yCenter;
      const yTopHor = yTopVer + radius;
      const yBottomVer = y + h - yCenter;
      const yBottomHor = yBottomVer - radius;
      context.moveTo(xLeftVer, yTopVer);
      context.lineTo(xRightVer, yTopVer);
      context.quadraticCurveTo(xRightHor, yTopVer, xRightHor, yTopHor);
      context.lineTo(xRightHor, yBottomHor);
      context.quadraticCurveTo(xRightHor, yBottomVer, xRightVer, yBottomVer);
      context.lineTo(xLeftVer, yBottomVer);
      context.quadraticCurveTo(xLeftHor, yBottomVer, xLeftHor, yBottomHor);
      context.lineTo(xLeftHor, yTopHor);
      context.quadraticCurveTo(xLeftHor, yTopVer, xLeftVer, yTopVer);

      context.resetTransform();
    },
  };

  public static Shape(cameraContext: CameraContext, b: Shape, fillStyle: FillStyle = null) {
    if (IsRectangle(b)) {
      Draw.Rectangle(cameraContext, b, fillStyle);
    } else if (IsCircle(b)) {
      Draw.Circle(cameraContext, b, fillStyle);
    } else if (IsTriangle(b)) {
      Draw.Triangle(cameraContext, b, fillStyle);
    } else if (IsPolygon(b)) {
      Draw.Polygon(cameraContext, b, fillStyle);
    } else if (IsPath(b)) {
      Draw.Path(cameraContext, b, fillStyle);
    } else if (IsSegment(b)) {
      Draw.Segment(cameraContext, b, fillStyle);
    } else if (IsRay(b)) {
      Draw.Ray(cameraContext, b, fillStyle);
    } else if (IsLine(b)) {
      Draw.Line(cameraContext, b, fillStyle);
    } else if (IsPoint(b)) {
      Draw.Explicit.Rectangle(cameraContext, b.x, b.y, 1, 1, fillStyle);
    }
  }

  public static CircleArc(
    cameraContext: CameraContext,
    circle: DeepReadonly<ICircle>,
    startAngle: number,
    endAngle: number,
    fillStyle: FillStyle = null
  ) {
    Draw.Explicit.CircleArc(cameraContext, circle.x, circle.y, circle.r, startAngle, endAngle, fillStyle);
  }

  public static CircleArcOutline(
    cameraContext: CameraContext,
    circle: DeepReadonly<ICircle>,
    startAngle: number,
    endAngle: number,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1,
    outlinePlacement: OutlinePlacement = OutlinePlacement.Default
  ) {
    Draw.Explicit.CircleArcOutline(
      cameraContext,
      circle.x,
      circle.y,
      circle.r,
      startAngle,
      endAngle,
      strokeStyle,
      lineWidth,
      outlinePlacement
    );
  }

  public static Circle(cameraContext: CameraContext, circle: DeepReadonly<ICircle>, fillStyle: FillStyle = null) {
    Draw.Explicit.Circle(cameraContext, circle.x, circle.y, circle.r, fillStyle);
  }

  public static CircleOutline(
    cameraContext: CameraContext,
    circle: DeepReadonly<ICircle>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1,
    outlinePlacement: OutlinePlacement = OutlinePlacement.Default
  ) {
    Draw.Explicit.CircleOutline(cameraContext, circle.x, circle.y, circle.r, strokeStyle, lineWidth, outlinePlacement);
  }

  public static CircleArcGradient(
    cameraContext: CameraContext,
    circle: DeepReadonly<ICircle>,
    colorStopArray: DeepReadonly<ColorStopArray>,
    startAngle: number = 0,
    endAngle: number = tau,
    alpha: number = 1
  ) {
    Draw.Explicit.CircleArcGradient(
      cameraContext,
      circle.x,
      circle.y,
      circle.r,
      colorStopArray,
      startAngle,
      endAngle,
      alpha
    );
  }

  public static CircleArcOutlineGradient(
    cameraContext: CameraContext,
    circle: DeepReadonly<ICircle>,
    colorStopArray: DeepReadonly<ColorStopArray>,
    startAngle: number,
    endAngle: number,
    alpha: number = 1,
    lineWidth: number = 1,
    outlinePlacement: OutlinePlacement = OutlinePlacement.Default
  ) {
    Draw.Explicit.CircleArcOutlineGradient(
      cameraContext,
      circle.x,
      circle.y,
      circle.r,
      colorStopArray,
      startAngle,
      endAngle,
      alpha,
      lineWidth,
      outlinePlacement
    );
  }

  public static Ring(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    innerRadius: number,
    outerRadius: number,
    strokeStyle: StrokeStyle = null
  ) {
    Draw.Explicit.Ring(cameraContext, position.x, position.y, innerRadius, outerRadius, strokeStyle);
  }

  public static OvalArc(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    xRadius: number,
    yRadius: number,
    startAngle: number,
    endAngle: number,
    fillStyle: FillStyle = null,
    angle: number = 0,
    center: DeepReadonly<IPoint> = position
  ) {
    Draw.Explicit.OvalArc(
      cameraContext,
      position.x,
      position.y,
      xRadius,
      yRadius,
      startAngle,
      endAngle,
      fillStyle,
      angle,
      center.x,
      center.y
    );
  }

  public static OvalArcOutline(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    xRadius: number,
    yRadius: number,
    startAngle: number,
    endAngle: number,
    strokeStyle: StrokeStyle = null,
    angle: number = 0,
    lineWidth: number = 1,
    outlinePlacement: OutlinePlacement = OutlinePlacement.Default
  ) {
    Draw.Explicit.OvalArcOutline(
      cameraContext,
      position.x,
      position.y,
      xRadius,
      yRadius,
      startAngle,
      endAngle,
      strokeStyle,
      angle,
      lineWidth,
      outlinePlacement
    );
  }

  public static Oval(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    xRadius: number,
    yRadius: number,
    fillStyle: FillStyle = null,
    angle: number = 0,
    center: DeepReadonly<IPoint> = position
  ) {
    Draw.Explicit.Oval(cameraContext, position.x, position.y, xRadius, yRadius, fillStyle, angle, center.x, center.y);
  }

  public static OvalOutline(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    xRadius: number,
    yRadius: number,
    strokeStyle: StrokeStyle = null,
    angle: number = 0,
    lineWidth: number = 1,
    outlinePlacement: OutlinePlacement = OutlinePlacement.Default
  ) {
    Draw.Explicit.OvalOutline(
      cameraContext,
      position.x,
      position.y,
      xRadius,
      yRadius,
      strokeStyle,
      angle,
      lineWidth,
      outlinePlacement
    );
  }

  public static Triangle(cameraContext: CameraContext, triangle: DeepReadonly<ITriangle>, fillStyle: FillStyle = null) {
    Draw.Explicit.Triangle(
      cameraContext,
      triangle.a.x,
      triangle.a.y,
      triangle.b.x,
      triangle.b.y,
      triangle.c.x,
      triangle.c.y,
      fillStyle
    );
  }

  public static TriangleOutline(
    cameraContext: CameraContext,
    triangle: DeepReadonly<ITriangle>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1
  ) {
    Draw.Explicit.TriangleOutline(
      cameraContext,
      triangle.a.x,
      triangle.a.y,
      triangle.b.x,
      triangle.b.y,
      triangle.c.x,
      triangle.c.y,
      strokeStyle,
      lineWidth
    );
  }

  public static Polygon(
    cameraContext: CameraContext,
    { vertices }: DeepReadonly<IPolygon>,
    fillStyle: FillStyle = null
  ) {
    Draw.Explicit.Polygon(cameraContext, vertices, fillStyle);
  }

  public static PolygonOutline(
    cameraContext: CameraContext,
    { vertices }: DeepReadonly<IPolygon>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1
  ) {
    Draw.Explicit.PolygonOutline(cameraContext, vertices, strokeStyle, lineWidth);
  }

  public static RegularPolygon(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    radius: number,
    sides: number,
    fillStyle: FillStyle = null,
    angle: number = 0
  ) {
    Draw.Explicit.RegularPolygon(cameraContext, position.x, position.y, radius, sides, fillStyle, angle);
  }

  public static RegularPolygonOutline(
    cameraContext: CameraContext,
    position: DeepReadonly<IPoint>,
    radius: number,
    sides: number,
    strokeStyle: StrokeStyle = null,
    angle: number = 0,
    lineWidth: number = 1
  ) {
    Draw.Explicit.RegularPolygonOutline(
      cameraContext,
      position.x,
      position.y,
      radius,
      sides,
      strokeStyle,
      angle,
      lineWidth
    );
  }

  public static Rectangle(
    cameraContext: CameraContext,
    { x, y, w, h }: DeepReadonly<IRectangle>,
    fillStyle: FillStyle = null,
    angle: number = 0,
    center?: DeepReadonly<IPoint>
  ) {
    Draw.Explicit.Rectangle(cameraContext, x, y, w, h, fillStyle, angle, center?.x, center?.y);
  }

  public static RectangleOutline(
    cameraContext: CameraContext,
    { x, y, w, h }: DeepReadonly<IRectangle>,
    strokeStyle: StrokeStyle = null,
    angle: number = 0,
    center?: DeepReadonly<IPoint>,
    lineWidth: number = 1,
    outlinePlacement: OutlinePlacement = OutlinePlacement.InnerFirst
  ) {
    Draw.Explicit.RectangleOutline(
      cameraContext,
      x,
      y,
      w,
      h,
      strokeStyle,
      angle,
      center?.x,
      center?.y,
      lineWidth,
      outlinePlacement
    );
  }

  public static RectangleGradientVertical(
    cameraContext: CameraContext,
    { x, y, w, h }: DeepReadonly<IRectangle>,
    colorStopArray: DeepReadonly<ColorStopArray>
  ) {
    Draw.Explicit.RectangleGradientVertical(cameraContext, x, y, w, h, colorStopArray);
  }

  public static RectangleGradientHorizontal(
    cameraContext: CameraContext,
    { x, y, w, h }: DeepReadonly<IRectangle>,
    colorStopArray: DeepReadonly<ColorStopArray>
  ) {
    Draw.Explicit.RectangleGradientHorizontal(cameraContext, x, y, w, h, colorStopArray);
  }

  public static RectangleRounded(
    cameraContext: CameraContext,
    { x, y, w, h }: DeepReadonly<IRectangle>,
    radius: number,
    fillStyle: FillStyle = null,
    angle: number = 0,
    center?: DeepReadonly<IPoint>
  ) {
    Draw.Explicit.RectangleRounded(cameraContext, x, y, w, h, radius, fillStyle, angle, center?.x, center?.y);
  }

  public static RectangleRoundedOutline(
    cameraContext: CameraContext,
    { x, y, w, h }: DeepReadonly<IRectangle>,
    radius: number,
    strokeStyle: StrokeStyle = null,
    angle: number = 0,
    center?: DeepReadonly<IPoint>,
    lineWidth = 1,
    outlinePlacement = OutlinePlacement.InnerFirst
  ) {
    Draw.Explicit.RectangleRoundedOutline(
      cameraContext,
      x,
      y,
      w,
      h,
      radius,
      strokeStyle,
      angle,
      center?.x,
      center?.y,
      lineWidth,
      outlinePlacement
    );
  }

  public static Line(
    cameraContext: CameraContext,
    line: DeepReadonly<ILine>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1
  ) {
    Draw.Explicit.Line(cameraContext, line.a.x, line.a.y, line.b.x, line.b.y, strokeStyle, lineWidth);
  }

  public static Ray(
    cameraContext: CameraContext,
    ray: DeepReadonly<IRay>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1
  ) {
    Draw.Explicit.Ray(cameraContext, ray.a.x, ray.a.y, ray.b.x, ray.b.y, strokeStyle, lineWidth);
  }

  public static Segment(
    cameraContext: CameraContext,
    segment: DeepReadonly<ISegment>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1
  ) {
    Draw.Explicit.Segment(cameraContext, segment.a.x, segment.a.y, segment.b.x, segment.b.y, strokeStyle, lineWidth);
  }

  public static Text(
    cameraContext: CameraContext,
    text: string,
    { x, y }: DeepReadonly<IPoint>,
    fillStyle: FillStyle = null,
    font: string | null = null,
    halign: HalignAll = Halign.LEFT,
    valign: ValignAll = Valign.TOP,
    angle: number = 0,
    center?: DeepReadonly<IPoint>
  ) {
    Draw.Explicit.Text(cameraContext, text, x, y, fillStyle, font, halign, valign, angle, center?.x, center?.y);
  }

  public static Path(
    { context, camera }: CameraContext,
    points: DeepReadonly<IPoint[]>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1,
    closePath: boolean = false
  ) {
    if (lineWidth <= 0 || points.length <= 0) return;
    context.beginPath();
    context.moveTo(points[0].x - camera.x, points[0].y - camera.y);
    for (let i = 1; i < points.length; i++) context.lineTo(points[i].x - camera.x, points[i].y - camera.y);
    if (closePath) context.closePath();
    if (strokeStyle) context.strokeStyle = this.StyleToString(strokeStyle);
    context.lineWidth = lineWidth;
    context.stroke();
  }

  public static BezierPath(
    { context, camera }: CameraContext,
    points: DeepReadonly<IPoint[]>,
    strokeStyle: StrokeStyle = null,
    lineWidth: number = 1,
    closePath: boolean = false
  ) {
    if (lineWidth <= 0 || points.length <= 0) return;
    context.beginPath();
    context.moveTo(points[0].x - camera.x, points[0].y - camera.y);
    for (let i = 1; i < points.length - 1; i++) {
      const previous = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      const xPreviousMid = (previous.x + current.x) / 2;
      const yPreviousMid = (previous.y + current.y) / 2;
      const xNextMid = (next.x + current.x) / 2;
      const yNextMid = (next.y + current.y) / 2;
      context.bezierCurveTo(
        xPreviousMid - camera.x,
        yPreviousMid - camera.y,
        current.x - camera.x,
        current.y - camera.y,
        xNextMid - camera.x,
        yNextMid - camera.y
      );
      if (i === points.length - 2) {
        context.lineTo(next.x - camera.x, next.y - camera.y);
      }
    }
    if (closePath) context.closePath();
    if (strokeStyle) context.strokeStyle = this.StyleToString(strokeStyle);
    context.lineWidth = lineWidth;
    context.stroke();
  }

  public static TextStyle(
    context: CameraContext['context'],
    fillStyle: FillStyle = null,
    font: string | null = null,
    halign?: HalignAll,
    valign?: ValignAll
  ) {
    if (font) context.font = font;
    if (halign) context.textAlign = halign;
    if (fillStyle) context.fillStyle = this.StyleToString(fillStyle);
    if (valign) context.textBaseline = valign;
  }

  public static TextWidth(context: CameraContext['context'], text: string, font: string | null = null) {
    if (font) context.font = font;
    return context.measureText(text).width;
  }

  // uses width of a capital 'M' to estimate height of text
  public static TextHeight(context: CameraContext['context'], font: string | null = null) {
    if (font) context.font = font;
    return context.measureText('M').width;
  }

  // Example:
  // Draw.applyBlendMode(context, BlendMode.Overlay, () => Draw.circle(cameraContext, 50, 50, 10, Color.red));
  public static ApplyBlendMode(context: CameraContext['context'], blendMode: BlendMode, drawCall: () => void) {
    const blendModeOriginal = context.globalCompositeOperation.toString();
    context.globalCompositeOperation = blendMode;
    drawCall();
    context.globalCompositeOperation = blendModeOriginal;
  }

  public static ApplyShadow(
    context: CameraContext['context'],
    shadowColor: FillStyle,
    shadowBlur: number,
    shadowOffset: IPoint = Geometry.Point.Zero,
    drawCall: () => void
  ) {
    const previousShadowColor = context.shadowColor;
    const previousShadowOffsetX = context.shadowOffsetX;
    const previousShadowOffsetY = context.shadowOffsetY;
    const previousShadowBlur = context.shadowBlur;
    if (shadowColor) context.shadowColor = this.StyleToString(shadowColor);
    context.shadowOffsetX = shadowOffset.x;
    context.shadowOffsetY = shadowOffset.y;
    context.shadowBlur = shadowBlur;
    drawCall();
    context.shadowColor = previousShadowColor;
    context.shadowOffsetX = previousShadowOffsetX;
    context.shadowOffsetY = previousShadowOffsetY;
    context.shadowBlur = previousShadowBlur;
  }

  private static ApplyOutlinePlacement(value: number, lineWidth: number, outlinePlacement: OutlinePlacement): number {
    switch (outlinePlacement) {
      case OutlinePlacement.FullyInner:
        return value - lineWidth / 2;
      case OutlinePlacement.FullyOuter:
        return value + lineWidth / 2;
      case OutlinePlacement.InnerFirst:
        return value - 0.5 + 0.5 * Math.abs((lineWidth % 2) - 1);
      case OutlinePlacement.OuterFirst:
        return value + 0.5 - 0.5 * Math.abs((lineWidth % 2) - 1);
      default:
        return value;
    }
  }

  private static StyleToString(style: FillStyle | StrokeStyle): string {
    return style instanceof Color ? Color.ToString(style) : (style as string).toString();
  }
}
