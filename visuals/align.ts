export enum Halign {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

export enum Valign {
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
}

/**
 * Get the offset from the "left" position for the given width and alignment
 * @example ```typescript
 * const xLeft = xCenter + HalignOffset(Halign.CENTER, width);
 * const xLeft = xRight + HalignOffset(Halign.RIGHT, width);
 * ```
 */
export function HalignOffset(halign: Halign, w: number): number {
  return halign === Halign.LEFT ? 0 : halign === Halign.CENTER ? -w / 2 : -w;
}

/**
 * Get the offset from the "top" position for the given height and alignment
 * @example ```typescript
 * const yTop = yMiddle + ValignOffset(Valign.MIDDLE, height);
 * const yTop = yBottom + ValignOffset(Valign.BOTTOM, height);
 * ```
 */
export function ValignOffset(valign: Valign, h: number): number {
  return valign === Valign.TOP ? 0 : valign === Valign.MIDDLE ? -h / 2 : -h;
}
