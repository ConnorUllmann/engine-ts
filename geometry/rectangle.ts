import { Point } from './point';
import { Circle } from './circle';
import { random } from '../core/utils';

export class Rectangle extends Point {
    public get xLeft(): number { return this.x; }
    public set xLeft(x: number) { this.x = x; }
    public get xRight(): number { return this.x + this.w; }
    public set xRight(x: number) { this.x = x - this.w; }
    public get yTop(): number { return this.y; }
    public set yTop(y: number) { this.y = y; }
    public get yBottom(): number { return this.y + this.h; }
    public set yBottom(y: number) { this.y = y - this.h; }
    public get xCenter(): number { return this.x + this.w/2; }
    public set xCenter(x: number) { this.x = x - this.w/2; }
    public get yCenter(): number { return this.y + this.h/2; }
    public set yCenter(y: number) { this.y = y - this.h/2; }
    public get center(): Point { return new Point(this.xCenter, this.yCenter); }
    public set center(center: Point) { this.x = center.x - this.w/2; this.y = center.y - this.h/2; }

    public get topLeft(): Point { return new Point(this.xLeft, this.yTop); }
    public get topRight(): Point { return new Point(this.xRight, this.yTop); }
    public get bottomLeft(): Point { return new Point(this.xLeft, this.yBottom); }
    public get bottomRight(): Point { return new Point(this.xRight, this.yBottom); }
    public get corners(): Point[] { return [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]; }
    public get segments(): { a: Point, b:Point }[] { 
        const corners = this.corners;
        return [
            { a: corners[0], b: corners[1] },
            { a: corners[1], b: corners[2] },
            { a: corners[2], b: corners[3] },
            { a: corners[3], b: corners[0] }
        ];
    }

    private _w: number;
    private _h: number;

    public get w(): number { return this._w; }
    public get h(): number { return this._h; }

    public set w(w: number) { this._w = w; }
    public set h(h: number) { this._h = h; }

    constructor(x: number = 0, y: number = 0, w: number = 0, h: number = 0) {
        super(x, y);
        this._w = w;
        this._h = h;
    }

    public cloneRectangle(): Rectangle { return new Rectangle(this.x, this.y, this.w, this.h); }
    public offset(other: Point): Rectangle { return new Rectangle(this.x + other.x, this.y + other.y, this.w, this.h); }
    public collidesPoint(x: number, y: number): boolean { return x >= this.x && y >= this.y && x < this.x + this.w && y < this.y + this.h; }
    public collidesRectangle(other:Rectangle): boolean { return Rectangle.collide(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h); }
    public collidesCircle(circle: Circle, rectangleAngleRadians: number=0, rectangleIsCentered: boolean=false) {
        // The rectangle's (x, y) position is its top-left corner if it were not rotated,
        // however the rectangle still rotates about its center (by "rectangleAngleRadians" radians)
        //https://stackoverflow.com/questions/401847/circle-rectangle-collision-detection-intersection
        const circlePosition = rectangleAngleRadians === 0
            ? new Point(circle.x, circle.y)
            : new Point(circle.x, circle.y).rotate(-rectangleAngleRadians, rectangleIsCentered ? this : this.center);

        const xCircleDistance = Math.abs(circlePosition.x - (rectangleIsCentered ? this.x : this.x + this.w/2));
        const yCircleDistance = Math.abs(circlePosition.y - (rectangleIsCentered ? this.y : this.y + this.h/2));

        if (xCircleDistance > (this.w/2 + circle.radius)) { return false; }
        if (yCircleDistance > (this.h/2 + circle.radius)) { return false; }

        if (xCircleDistance <= (this.w/2)) { return true; }
        if (yCircleDistance <= (this.h/2)) { return true; }

        const cornerDistanceSq =
            (xCircleDistance - this.w/2) * (xCircleDistance - this.w/2) +
            (yCircleDistance - this.h/2) * (yCircleDistance - this.h/2);

        return cornerDistanceSq <= (circle.radius * circle.radius);
    };

    public static collide(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number): boolean { 
        return ax + aw > bx && ay + ah > by && ax < bx + bw && ay < by + bh;
    }

    // Expands the rectangle by the given amount on each side
    public expandFromCenter(amount: number): void {
        this.x -= amount;
        this.w += 2 * amount;
        this.y -= amount;
        this.h += 2 * amount;
    };

    // Returns a copy of this rectangle expanded by the given amount on each side
    public expandedFromCenter(amount: number): Rectangle {
        const result = this.cloneRectangle();
        result.expandFromCenter(amount);
        return result;
    };

    // Expands the rectangle by the given amount on each side, scaled by the current side lengths
    public scaleFromCenter(scalar: number): void {
        const wAmount = this.w / 2 * scalar;
        const hAmount = this.h / 2 * scalar;
        this.x -= wAmount;
        this.w += 2 * wAmount;
        this.y -= hAmount;
        this.h += 2 * hAmount;
    };

    // Returns a copy of this rectangle expanded by the given amount on each side, scaled by the current side lengths
    public scaledFromCenter(scalar: number): Rectangle {
        const result = this.cloneRectangle();
        result.scaleFromCenter(scalar);
        return result;
    };

    public get randomPointInside(): Point {
        return new Point(random() * this.w + this.x, random() * this.h + this.y);
    }
}