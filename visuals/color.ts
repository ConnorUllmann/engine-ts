import { RNG } from '../core/rng';
import { clamp, DeepReadonly, rng } from '../core/utils';

export class Color {
    public static red: DeepReadonly<Color>;
    public static green: DeepReadonly<Color>;
    public static blue: DeepReadonly<Color>;
    public static cyan: DeepReadonly<Color>;
    public static yellow: DeepReadonly<Color>;
    public static magenta: DeepReadonly<Color>;
    public static purple: DeepReadonly<Color>;
    public static orange: DeepReadonly<Color>;
    public static brown: DeepReadonly<Color>;
    public static lightBrown: DeepReadonly<Color>;
    public static black: DeepReadonly<Color>;
    public static lightGrey: DeepReadonly<Color>;
    public static grey: DeepReadonly<Color>;
    public static darkGrey: DeepReadonly<Color>;
    public static white: DeepReadonly<Color>;
    public static none: DeepReadonly<Color>;

    public get red(): number { return this._red; }
    public get green(): number { return this._green; }
    public get blue(): number { return this._blue; }
    public get alpha(): number { return this._alpha; }

    public set red(value: number) { this._red = clamp(value, 0, 255); }
    public set green(value: number) { this._green = clamp(value, 0, 255); }
    public set blue(value: number) { this._blue = clamp(value, 0, 255); }
    public set alpha(value: number) { this._alpha = clamp(value, 0, 1); }

    constructor(protected _red: number, protected _green: number, protected _blue: number, protected _alpha: number=1) {
        this.red = _red;
        this.green = _green;
        this.blue = _blue;
        this.alpha = _alpha;
    }

    public toString(): string {
        return Color.ToString(this);
    }

    public static Random(_rng?: RNG): Color {
        return new Color(Math.floor((_rng ?? rng).random() * 256), Math.floor((_rng ?? rng).random() * 256), Math.floor((_rng ?? rng).random() * 256));
    }

    public static Create(color: DeepReadonly<Color>, alpha: number | null=null): Color {
        return new Color(color.red, color.green, color.blue, alpha != null ? alpha : color.alpha);
    }

    public static ToString(color: DeepReadonly<Color>): string {
        return `rgba(${color.red},${color.green},${color.blue},${color.alpha})`;
    }

    public static ToInt(color: DeepReadonly<Color>): number {
        return (color.alpha << 24) | (color.red << 16) | (color.green << 8) | color.blue;
    }

    public static FromInt(value: number): Color {
        return new Color((value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF, (value >> 24) & 0xFF);
    }

    public static Lerp(a: DeepReadonly<Color>, b: DeepReadonly<Color>, amount: number): Color {
        if(amount <= 0) return Color.Create(a);
        if(amount >= 1) return Color.Create(b);
        return new Color(
            (b.red - a.red) * amount + a.red,
            (b.green - a.green) * amount + a.green,
            (b.blue - a.blue) * amount + a.blue,
            (b.alpha - a.alpha) * amount + a.alpha
        );
    }

    public static Inverted(color: DeepReadonly<Color>): Color {
        return new Color(255 - color.red, 255 - color.green, 255 - color.blue, color.alpha);
    }

    public static AreEqual(a: DeepReadonly<Color> | null | undefined, b: DeepReadonly<Color> | null | undefined): boolean {
        if(a == null && b == null)
            return true;
        if(a == null || b == null)
            return false;
        return a.red === b.red
            && a.green === b.green
            && a.blue === b.blue
            && a.alpha === b.alpha;
    }
}

Color.red = new Color(255, 0, 0);
Color.green = new Color(0, 255, 0);
Color.blue = new Color(0, 0, 255);
Color.cyan = new Color(0, 255, 255);
Color.yellow = new Color(255, 255, 0);
Color.orange = new Color(255, 128, 0);
Color.brown = new Color(40, 26, 13);
Color.lightBrown = new Color(153, 102, 51);
Color.magenta = new Color(255, 0, 255);
Color.purple = new Color(105, 0, 204);
Color.black = new Color(0, 0, 0);
Color.lightGrey = new Color(192, 192, 192);
Color.grey = new Color(128, 128, 128);
Color.darkGrey = new Color(64, 64, 64);
Color.white = new Color(255, 255, 255);
Color.none = new Color(0, 0, 0, 0);