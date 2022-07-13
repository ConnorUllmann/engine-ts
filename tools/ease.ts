import { angle180, angle90 } from '../core/utils';

type Easer = (t: number) => number;

// https://github.com/NoelFB/Foster/blob/master/Framework/Utils/Ease.cs
// https://easings.net/en
export class Ease {
  public static Invert(easer: Easer): Easer {
    return (t: number) => 1 - easer(1 - t);
  }

  // TODO: generalize for any number of easers
  public static Follow(first: Easer, second: Easer): Easer {
    return (t: number) => (t <= 0.5 ? first(t * 2) / 2 : second(t * 2 - 1) / 2 + 0.5);
  }

  public static Linear(t: number): number {
    return t;
  }

  public static SineIn(t: number): number {
    return 1 - Math.cos(angle90 * t);
  }
  public static SineOut(t: number): number {
    return Math.sin(angle90 * t);
  }
  public static SineInOut(t: number): number {
    return 0.5 - 0.5 * Math.cos(angle180 * t);
  }

  public static QuadIn(t: number): number {
    return t * t;
  }
  public static QuadOut = Ease.Invert(Ease.QuadIn);
  public static QuadInOut = Ease.Follow(Ease.QuadIn, Ease.QuadOut);

  public static CubeIn(t: number): number {
    return t * t * t;
  }
  public static CubeOut = Ease.Invert(Ease.CubeIn);
  public static CubeInOut = Ease.Follow(Ease.CubeIn, Ease.CubeOut);

  public static QuartIn(t: number): number {
    return t * t * t * t;
  }
  public static QuartOut = Ease.Invert(Ease.QuartIn);
  public static QuartInOut = Ease.Follow(Ease.QuartIn, Ease.QuartOut);

  public static QuintIn(t: number): number {
    return t * t * t * t * t;
  }
  public static QuintOut = Ease.Invert(Ease.QuintIn);
  public static QuintInOut = Ease.Follow(Ease.QuintIn, Ease.QuintOut);

  public static ExpoIn(t: number): number {
    return Math.pow(2, 10 * (t - 1));
  }
  public static ExpoOut = Ease.Invert(Ease.ExpoIn);
  public static ExpoInOut = Ease.Follow(Ease.ExpoIn, Ease.ExpoOut);

  public static BackIn(t: number): number {
    return t * t * (2.70158 * t - 1.70158);
  }
  public static BackOut = Ease.Invert(Ease.BackIn);
  public static BackInOut = Ease.Follow(Ease.BackIn, Ease.BackOut);

  public static BigBackIn(t: number): number {
    return t * t * (4 * t - 3);
  }
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
    if (t < Ease.B1) return 1 - 7.5625 * t * t;
    if (t < Ease.B2) return 1 - (7.5625 * (t - Ease.B3) * (t - Ease.B3) + 0.75);
    if (t < Ease.B4) return 1 - (7.5625 * (t - Ease.B5) * (t - Ease.B5) + 0.9375);
    return 1 - (7.5625 * (t - Ease.B6) * (t - Ease.B6) + 0.984375);
  }

  public static BounceOut(t: number): number {
    if (t < Ease.B1) return 7.5625 * t * t;
    if (t < Ease.B2) return 7.5625 * (t - Ease.B3) * (t - Ease.B3) + 0.75;
    if (t < Ease.B4) return 7.5625 * (t - Ease.B5) * (t - Ease.B5) + 0.9375;
    return 7.5625 * (t - Ease.B6) * (t - Ease.B6) + 0.984375;
  }

  public static BounceInOut(t: number): number {
    if (t < 0.5) {
      t = 1 - t * 2;
      if (t < Ease.B1) return (1 - 7.5625 * t * t) / 2;
      if (t < Ease.B2) return (1 - (7.5625 * (t - Ease.B3) * (t - Ease.B3) + 0.75)) / 2;
      if (t < Ease.B4) return (1 - (7.5625 * (t - Ease.B5) * (t - Ease.B5) + 0.9375)) / 2;
      return (1 - (7.5625 * (t - Ease.B6) * (t - Ease.B6) + 0.984375)) / 2;
    }
    t = t * 2 - 1;
    if (t < Ease.B1) return (7.5625 * t * t) / 2 + 0.5;
    if (t < Ease.B2) return (7.5625 * (t - Ease.B3) * (t - Ease.B3) + 0.75) / 2 + 0.5;
    if (t < Ease.B4) return (7.5625 * (t - Ease.B5) * (t - Ease.B5) + 0.9375) / 2 + 0.5;
    return (7.5625 * (t - Ease.B6) * (t - Ease.B6) + 0.984375) / 2 + 0.5;
  }

  // a > 0 bends "upward" towards 1 (acts similarly to x^y where y is between 0 and 1)
  // a < 0 bends "downward" towards 0 (acts similarly to x^a)
  // a == 0 is a line
  public static Bend(t: number, a: number): number {
    return a === 0 ? t : a < 0 ? 1 - (1 - 1 / ((1 - t) * -a + 1)) * (1 + 1 / -a) : (1 - 1 / (t * a + 1)) * (1 + 1 / a);
  }

  public static GetBendEaser(a: number): (t: number) => number {
    return (t: number) => Ease.Bend(t, a);
  }
  public static BendUp1 = Ease.GetBendEaser(1);
  public static BendUp2 = Ease.GetBendEaser(2);
  public static BendUp5 = Ease.GetBendEaser(5);
  public static BendUp10 = Ease.GetBendEaser(10);
  public static BendUp25 = Ease.GetBendEaser(25);
  public static BendUp100 = Ease.GetBendEaser(100);
  public static BendUp1000 = Ease.GetBendEaser(1000);
  public static BendDown1 = Ease.GetBendEaser(-1);
  public static BendDown2 = Ease.GetBendEaser(-2);
  public static BendDown5 = Ease.GetBendEaser(-5);
  public static BendDown10 = Ease.GetBendEaser(-10);
  public static BendDown25 = Ease.GetBendEaser(-25);
  public static BendDown100 = Ease.GetBendEaser(-100);
  public static BendDown1000 = Ease.GetBendEaser(-1000);
}
