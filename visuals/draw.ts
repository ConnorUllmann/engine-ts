import { Color } from './color';
import { BlendMode } from './blend-mode';
import { ColorStopArray } from './color-stop-array';
import { Point } from '../geometry/point';
import { World } from '../core/world';
import { tau } from '../core/utils';

export type FillStyle = Color | string | null;
export type StrokeStyle = FillStyle;
export type Halign = "left" | "center" | "right" | "start" | "end";
export type Valign = "top" | "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";

export class Draw {

    public static circle(world: World, x: number, y: number, radius: number, fillStyle: FillStyle=null) {
        if(radius <= 0)
            return;    
        const context = world.context;
        context.beginPath();
        context.arc(x - world.camera.x, y - world.camera.y, radius, 0, tau);
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        context.fill();
    };

    public static circleOutline(world: World, x: number, y: number, radius: number, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(radius <= 0 || lineWidth <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.arc(x - world.camera.x, y - world.camera.y, radius, 0, tau);
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();
        context.stroke();
    };

    // same as circleOutline except you specify the inner and outer radii
    public static ring(world: World, x: number, y: number, innerRadius: number, outerRadius: number, strokeStyle: StrokeStyle=null) {
        if(outerRadius <= 0)
            return;
        const lineWidth = outerRadius - innerRadius;
        const radius = (outerRadius + innerRadius) / 2;
        Draw.circleOutline(world, x, y, radius, strokeStyle, lineWidth);
    };

    public static oval(world: World, x: number, y: number, xRadius: number, yRadius: number, fillStyle: FillStyle=null, angleRadians: number=0) {
        if(xRadius <= 0 || yRadius <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.ellipse(x - world.camera.x, y - world.camera.y, xRadius, yRadius, angleRadians, 0, tau);
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        context.fill();
    };

    public static ovalOutline(world: World, x: number, y: number, xRadius: number, yRadius: number, strokeStyle: StrokeStyle=null, angleRadians: number=0, lineWidth: number=1) {
        if(xRadius <= 0 || yRadius <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.ellipse(x - world.camera.x, y - world.camera.y, xRadius, yRadius, angleRadians, 0, tau);
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();
        context.stroke();
    };

    public static triangle(world: World, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, fillStyle: FillStyle=null) {
        const context = world.context;
        context.beginPath();
        context.moveTo(x1 - world.camera.x, y1 - world.camera.y);
        context.lineTo(x2 - world.camera.x, y2 - world.camera.y);
        context.lineTo(x3 - world.camera.x, y3 - world.camera.y);
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        context.fill();
    };

    public static triangleOutline(world: World, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        const context = world.context;
        context.beginPath();
        context.moveTo(x1 - world.camera.x, y1 - world.camera.y);
        context.lineTo(x2 - world.camera.x, y2 - world.camera.y);
        context.lineTo(x3 - world.camera.x, y3 - world.camera.y);
        context.closePath();
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();
        context.stroke();
    };

    public static polygon(world: World, points: Point[], fillStyle: FillStyle=null) {
        if(points.length <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(points.first().x - world.camera.x, points.first().y - world.camera.y);
        for(let i = 1; i < points.length; i++)
            context.lineTo(points[i].x - world.camera.x, points[i].y - world.camera.y);
        context.closePath();
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        context.fill();
    };

    public static polygonOutline(world: World, points: Point[], strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(points.length <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(points.first().x - world.camera.x, points.first().y - world.camera.y);
        for(let i = 1; i < points.length; i++)
            context.lineTo(points[i].x - world.camera.x, points[i].y - world.camera.y);
        context.closePath();
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();
        context.stroke();
    };

    public static regularPolygon(world: World, x: number, y: number, radius: number, sides: number, fillStyle: FillStyle=null, angleRadians: number=0) {
        const context = world.context;
        const points = Draw._getRegularPolygonPoints(x, y, radius, sides, angleRadians);
        if(points.length <= 0)
            return;
        context.beginPath();
        for(let i = 0; i < points.length; i++)
        {
            const point = points[i].subtract(world.camera);
            if(i === 0)
                context.moveTo(point.x, point.y);
            else
                context.lineTo(point.x, point.y);
        }
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        context.fill();
    };

    public static regularPolygonOutline(world: World, x: number, y: number, radius: number, sides: number, strokeStyle: StrokeStyle=null, angleRadians: number=0, lineWidth: number=1) {
        const context = world.context;
        const points = Draw._getRegularPolygonPoints(x, y, radius, sides, angleRadians);
        if(points.length <= 0)
            return;
        points.push(points.first());
        context.beginPath();
        for(let i = 0; i < points.length; i++)
        {
            const point = points[i].subtract(world.camera);
            if(i === 0)
                context.moveTo(point.x, point.y);
            else
                context.lineTo(point.x, point.y);
        }
        context.lineWidth = lineWidth;
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();
        context.stroke();
    };

    private static _getRegularPolygonPoints(x: number, y: number, radius: number, sides: number, angleRadians: number) {
        if(sides <= 0)
            throw `Cannot create a regular polygon with ${sides} sides`;
        const position = new Point(x, y);
        const points = [];
        for(let i = 0; i < sides; i++)
        {
            const angleRadiansToCorner = tau * i / sides + angleRadians;
            const point = Point.create(radius, angleRadiansToCorner).add(position);
            points.push(point);
        }
        return points;
    };

    public static rectangle(world: World, x: number, y: number, w: number, h: number, fillStyle: FillStyle=null) {
        const context = world.context;
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        context.fillRect(x - world.camera.x, y - world.camera.y, w, h);
    };
    
    public static rectangleRotated(world: World, xCenter: number, yCenter: number, w: number, h: number, fillStyle: FillStyle=null, angleRadians: number=0) {
        if(angleRadians === 0)
        {
            Draw.rectangle(world, xCenter - w/2, yCenter - h/2, w, h, fillStyle);
            return;
        }
    
        const context = world.context;
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        xCenter = xCenter - world.camera.x;
        yCenter = yCenter - world.camera.y;
        context.translate(xCenter, yCenter);
        context.rotate(angleRadians);
        context.fillRect(-w/2, -h/2, w, h);
        context.rotate(-angleRadians);
        context.translate(-xCenter, -yCenter);
    };
    
    public static rectangleOutline(world: World, x: number, y: number, w: number, h: number, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        const points: Point[] = [
            new Point(x, y),
            new Point(x + w, y),
            new Point(x + w, y + h),
            new Point(x, y + h)
        ];
        Draw.lines(world, points, strokeStyle, lineWidth, true);
    };
    
    public static rectangleGradientVertical(world: World, x: number, y: number, w: number, h: number, colorStopArray: ColorStopArray) {
        const context = world.context;
        const diff = new Point(x, y).subtract(world.camera);
        const gradient = context.createLinearGradient(diff.x, diff.y, diff.x, diff.y + h);
        colorStopArray.applyToGradient(gradient);
        context.fillStyle = gradient;
        context.fillRect(diff.x, diff.y, w, h);
    };
    
    public static rectangleGradientHorizontal(world: World, x: number, y: number, w: number, h: number, colorStopArray: ColorStopArray) {
        const context = world.context;
        const diff = new Point(x, y).subtract(world.camera);
        const gradient = context.createLinearGradient(diff.x, diff.y, diff.x + w, diff.y);
        colorStopArray.applyToGradient(gradient);
        context.fillStyle = gradient;
        context.fillRect(diff.x, diff.y, w, h);
    };

    public static line(world: World, x1: number, y1: number, x2: number, y2: number, strokeStyle: StrokeStyle=null, lineWidth: number=1) {
        if(lineWidth < 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(x1 - world.camera.x, y1 - world.camera.y);
        context.lineTo(x2 - world.camera.x, y2 - world.camera.y);
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();
        context.lineWidth = lineWidth;
        context.stroke();
    };

    public static lines(world: World, points: Point[], strokeStyle: StrokeStyle=null, lineWidth: number=1, closePath: boolean=false) {
        if(lineWidth <= 0 || points.length <= 0)
            return;
        const context = world.context;
        context.beginPath();
        context.moveTo(points[0].x - world.camera.x, points[0].y - world.camera.y);
        for(let i = 1; i < points.length; i++)
            context.lineTo(points[i].x - world.camera.x, points[i].y - world.camera.y);
        if(closePath)
            context.closePath();
        if(strokeStyle)
            context.strokeStyle = strokeStyle.toString();;
        context.lineWidth = lineWidth;
        context.stroke();
    };

    public static text(world: World, text: string, x: number, y: number, fillStyle: FillStyle=null, font: string | null=null, halign:Halign="left", valign:Valign="top") {
        const context = world.context;
        Draw.textStyle(world, fillStyle, font, halign, valign);
        context.fillText(text, x - world.camera.x, y - world.camera.y);
    };

    public static textStyle(world: World, fillStyle: FillStyle=null, font: string | null=null, halign: Halign=null, valign: Valign=null) {
        const context = world.context;
        if(font)
            context.font = font;
        if(halign)
            context.textAlign = halign;
        if(fillStyle)
            context.fillStyle = fillStyle.toString();
        if(valign)
            context.textBaseline = valign;
    };

    public static textWidth(world: World, text: string, font: string | null=null) {
        const context = world.context;
        if(font)
            context.font = font;
        return context.measureText(text).width;
    };

    // Example:
    // Draw.applyBlendMode(world, BlendMode.Overlay, () =>
    // {
    //     Draw.circle(world, 50, 50, 10, Color.red);
    // });
    public static applyBlendMode(world: World, blendMode: BlendMode, drawCall: () => void)
    {
        const context = world.context;
        const blendModeOriginal = context.globalCompositeOperation.toString();
        context.globalCompositeOperation = blendMode;
        drawCall();
        context.globalCompositeOperation = blendModeOriginal;
    };
}