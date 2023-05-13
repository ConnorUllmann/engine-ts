import { enumToList } from './utils';

export enum Button {
  A = 'A',
  B = 'B',
  X = 'X',
  Y = 'Y',
  LB = 'LB',
  RB = 'RB',
  LT = 'LT',
  RT = 'RT',
  SELECT = 'SELECT',
  BACK = 'BACK',
  START = 'START',
  L3 = 'L3',
  R3 = 'R3',
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  LEFT_ANALOG_UP = 'LUP',
  LEFT_ANALOG_RIGHT = 'LRIGHT',
  LEFT_ANALOG_DOWN = 'LDOWN',
  LEFT_ANALOG_LEFT = 'LLEFT',

  // 8-directional movement
  LEFT_ANALOG_UP_8 = 'LUP_8',
  LEFT_ANALOG_RIGHT_8 = 'LRIGHT_8',
  LEFT_ANALOG_DOWN_8 = 'LDOWN_8',
  LEFT_ANALOG_LEFT_8 = 'LLEFT_8',

  // 4-directional movement
  LEFT_ANALOG_UP_4 = 'LUP_4',
  LEFT_ANALOG_RIGHT_4 = 'LRIGHT_4',
  LEFT_ANALOG_DOWN_4 = 'LDOWN_4',
  LEFT_ANALOG_LEFT_4 = 'LLEFT_4',

  RIGHT_ANALOG_UP = 'RUP',
  RIGHT_ANALOG_RIGHT = 'RRIGHT',
  RIGHT_ANALOG_DOWN = 'RDOWN',
  RIGHT_ANALOG_LEFT = 'RLEFT',

  // 8-directional movement
  RIGHT_ANALOG_UP_8 = 'RUP_8',
  RIGHT_ANALOG_RIGHT_8 = 'RRIGHT_8',
  RIGHT_ANALOG_DOWN_8 = 'RDOWN_8',
  RIGHT_ANALOG_LEFT_8 = 'RLEFT_8',

  // 4-directional movement
  RIGHT_ANALOG_UP_4 = 'RUP_4',
  RIGHT_ANALOG_RIGHT_4 = 'RRIGHT_4',
  RIGHT_ANALOG_DOWN_4 = 'RDOWN_4',
  RIGHT_ANALOG_LEFT_4 = 'RLEFT_4',
}
export const Buttons = enumToList(Button);

export const AnalogDirectionButtons = [
  Button.LEFT_ANALOG_UP,
  Button.LEFT_ANALOG_RIGHT,
  Button.LEFT_ANALOG_DOWN,
  Button.LEFT_ANALOG_LEFT,

  Button.LEFT_ANALOG_UP_8,
  Button.LEFT_ANALOG_RIGHT_8,
  Button.LEFT_ANALOG_DOWN_8,
  Button.LEFT_ANALOG_LEFT_8,

  Button.LEFT_ANALOG_UP_4,
  Button.LEFT_ANALOG_RIGHT_4,
  Button.LEFT_ANALOG_DOWN_4,
  Button.LEFT_ANALOG_LEFT_4,

  Button.RIGHT_ANALOG_UP,
  Button.RIGHT_ANALOG_RIGHT,
  Button.RIGHT_ANALOG_DOWN,
  Button.RIGHT_ANALOG_LEFT,

  Button.RIGHT_ANALOG_UP_8,
  Button.RIGHT_ANALOG_RIGHT_8,
  Button.RIGHT_ANALOG_DOWN_8,
  Button.RIGHT_ANALOG_LEFT_8,

  Button.RIGHT_ANALOG_UP_4,
  Button.RIGHT_ANALOG_RIGHT_4,
  Button.RIGHT_ANALOG_DOWN_4,
  Button.RIGHT_ANALOG_LEFT_4,
] as const;
export type AnalogDirectionButton = (typeof AnalogDirectionButtons)[number];

export const NonAnalogDirectionButtons = Buttons.filter(
  button => !AnalogDirectionButtons.includes(button as any)
) as Exclude<Button, AnalogDirectionButton>[];
