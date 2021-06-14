import { tau, angle90 } from '@engine-ts/core/utils';

type Easer = (t: number) => number;

// https://github.com/NoelFB/Foster/blob/master/Framework/Utils/Ease.cs
// https://easings.net/en
export class Ease {
    public static Invert(easer: Easer): Easer {
        return (t: number) => 1 - easer(1 - t);
    }

    // TODO: generalize for any number of easers
    public static Follow(first: Easer, second: Easer): Easer {
        return (t: number) => 
            t <= 0.5
                ? first(t * 2) / 2
                : second(t * 2 - 1) / 2 + 0.5;
    }

    public static Linear(t: number): number { return t; }

    public static SineIn(t: number): number { return 1 - Math.cos(angle90 * t); }
    public static SineOut(t: number): number { return Math.sin(angle90 * t); }
    public static SineInOut(t: number): number { return 0.5 - 0.5 * Math.cos(angle90 * t); }

    public static QuadIn(t: number): number { return t * t; }
    public static QuadOut = Ease.Invert(Ease.QuadIn);
    public static QuadInOut = Ease.Follow(Ease.QuadIn, Ease.QuadOut);

    public static CubeIn(t: number): number { return t * t * t; }
    public static CubeOut = Ease.Invert(Ease.CubeIn);
    public static CubeInOut = Ease.Follow(Ease.CubeIn, Ease.CubeOut);

    public static QuartIn(t: number): number { return t * t * t * t; }
    public static QuartOut = Ease.Invert(Ease.QuartIn);
    public static QuartInOut = Ease.Follow(Ease.QuartIn, Ease.QuartOut);

    public static QuintIn(t: number): number { return t * t * t * t * t; }
    public static QuintOut = Ease.Invert(Ease.QuintIn);
    public static QuintInOut = Ease.Follow(Ease.QuintIn, Ease.QuintOut);

    public static ExpoIn(t: number): number { return Math.pow(2, 10 * (t - 1)); }
    public static ExpoOut = Ease.Invert(Ease.ExpoIn);
    public static ExpoInOut = Ease.Follow(Ease.ExpoIn, Ease.ExpoOut);

    public static BackIn(t: number): number { return t * t * (2.70158 * t - 1.70158); }
    public static BackOut = Ease.Invert(Ease.BackIn);
    public static BackInOut = Ease.Follow(Ease.BackIn, Ease.BackOut);

    public static BigBackIn(t: number): number { return t * t * (4 * t - 3); }
    public static BigBackOut = Ease.Invert(Ease.BigBackIn);
    public static BigBackInOut = Ease.Follow(Ease.BigBackIn, Ease.BigBackOut);

    private static readonly B1: number = 1 / 2.75;
    private static readonly B2 = 2 / 2.75;
    private static readonly B3 = 1.5 / 2.75;
    private static readonly B4 = 2.5 / 2.75;
    private static readonly B5 = 2.25 / 2.75;
    private static readonly B6 = 2.625 / 2.75;

    public static BounceIn(t: number): number {
        t = 1 - t;
        if (t < Ease.B1)
            return 1 - 7.5625 * t * t;
        if (t < Ease.B2)
            return 1 - (7.5625 * (t - Ease.B3) * (t - Ease.B3) + .75);
        if (t < Ease.B4)
            return 1 - (7.5625 * (t - Ease.B5) * (t - Ease.B5) + .9375);
        return 1 - (7.5625 * (t - Ease.B6) * (t - Ease.B6) + .984375);
    };

    public static BounceOut(t: number): number {
        if (t < Ease.B1)
            return 7.5625 * t * t;
        if (t < Ease.B2)
            return 7.5625 * (t - Ease.B3) * (t - Ease.B3) + .75;
        if (t < Ease.B4)
            return 7.5625 * (t - Ease.B5) * (t - Ease.B5) + .9375;
        return 7.5625 * (t - Ease.B6) * (t - Ease.B6) + .984375;
    };

    public static BounceInOut(t: number): number {
        if (t < .5)
        {
            t = 1 - t * 2;
            if (t < Ease.B1)
                return (1 - 7.5625 * t * t) / 2;
            if (t < Ease.B2)
                return (1 - (7.5625 * (t - Ease.B3) * (t - Ease.B3) + .75)) / 2;
            if (t < Ease.B4)
                return (1 - (7.5625 * (t - Ease.B5) * (t - Ease.B5) + .9375)) / 2;
            return (1 - (7.5625 * (t - Ease.B6) * (t - Ease.B6) + .984375)) / 2;
        }
        t = t * 2 - 1;
        if (t < Ease.B1)
            return (7.5625 * t * t) / 2 + .5;
        if (t < Ease.B2)
            return (7.5625 * (t - Ease.B3) * (t - Ease.B3) + .75) / 2 + .5;
        if (t < Ease.B4)
            return (7.5625 * (t - Ease.B5) * (t - Ease.B5) + .9375) / 2 + .5;
        return (7.5625 * (t - Ease.B6) * (t - Ease.B6) + .984375) / 2 + .5;
    };
}