// gives the x,y indices of a spiral along a tiled grid where n is the number of steps along the spiral
// n = 0 is (0, 0), n = 1 is (0, -1), then proceeds clockwise
export function spiral(n: number): { x: number; y: number } | null {
  if (n < 0) return null;

  n++;

  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  let t = 2 * k + 1;
  let m = t * t;
  t--;

  return {
    x: xSpiralHelper(n, m, t, k),
    y: ySpiralHelper(n, m, t, k),
  };
}

export function xSpiral(n: number): number | null {
  if (n < 0) return null;

  n++;

  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  let t = 2 * k + 1;
  let m = t * t;
  t--;

  return xSpiralHelper(n, m, t, k);
}

export function ySpiral(n: number): number | null {
  if (n < 0) return null;

  n++;

  const k = Math.ceil((Math.sqrt(n) - 1) / 2);
  let t = 2 * k + 1;
  let m = t * t;
  t--;

  return ySpiralHelper(n, m, t, k);
}

function xSpiralHelper(n: number, m: number, t: number, k: number): number {
  if (n >= m - t) return -k;
  m -= t;

  if (n >= m - t) return m - n - k;
  m -= t;

  if (n >= m - t) return k;
  return -m + n + k + t;
}

function ySpiralHelper(n: number, m: number, t: number, k: number): number {
  if (n >= m - t) return -m + n + k;
  m -= t;

  if (n >= m - t) return -k;
  m -= t;

  if (n >= m - t) return m - k - n;
  return k;
}
