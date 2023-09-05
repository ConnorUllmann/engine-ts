type Easer = (t: number) => number;

// https://github.com/NoelFB/Foster/blob/master/Framework/Utils/Ease.cs
// https://easings.net/en
export class Ease {
  public static Invert(easer: Easer): Easer {
    return (t: number) => 1 - easer(1 - t);
  }

  // "tSplit" corresponds to the value of "t" at which the transition from "first" to "second" happens
  // "ySplit" corresponds to the amount of the output that is weighted toward "first" vs "second"
  //    e.g. if ySplit=0.75, then the return value of this easer when "first" finishes (is passed a "1") will be 0.75
  public static Follow(first: Easer, second: Easer, tSplit = 0.5, ySplit = 0.5): Easer {
    if (tSplit <= 0) return first;
    if (tSplit >= 1) return second;
    return (t: number) =>
      t <= tSplit ? first(t / tSplit) * ySplit : second((t - tSplit) / (1 - tSplit)) * (1 - ySplit) + ySplit;
  }

  public static FollowMultiple(
    ...args: [{ easer: Easer; yStart: number }, ...{ easer: Easer; tStart: number; yStart: number }[], { yEnd: number }]
  ): Easer {
    return (t: number) => {
      for (let i = 0; i < args.length - 1; i++) {
        const arg = args[i];

        const tStart: number = (arg as any).tStart ?? 0;
        if (t < tStart) continue;

        const tEnd = i === args.length - 2 ? 1 : (args[i + 1] as any).tStart ?? 0;
        if (t > tEnd) continue;

        const easer = (arg as any).easer;
        const yStart: number = (arg as any).yStart;
        const yEnd = i === args.length - 2 ? (args[i + 1] as any).yEnd : (args[i + 1] as any).yStart ?? 0;
        const tNew = (t - tStart) / Math.max(0.0000001, tEnd - tStart);
        return easer(tNew) * (yEnd - yStart) + yStart;
      }
      return (args[args.length - 1] as any).yEnd;
    };
  }

  public static Linear(t: number): number {
    return t;
  }

  public static SineIn(t: number): number {
    return 1 - Math.cos((Math.PI / 2) * t);
  }
  public static SineOut(t: number): number {
    return Math.sin((Math.PI / 2) * t);
  }
  public static SineInOut(t: number): number {
    return 0.5 - 0.5 * Math.cos(Math.PI * t);
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
