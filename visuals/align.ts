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

export function HalignOffset(halign: Halign, w: number): number {
  return halign === Halign.LEFT ? 0 : halign === Halign.CENTER ? -w / 2 : -w;
}

export function ValignOffset(valign: Valign, h: number): number {
  return valign === Valign.TOP ? 0 : valign === Valign.MIDDLE ? -h / 2 : -h;
}
