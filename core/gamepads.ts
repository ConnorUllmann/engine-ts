import {
  CardinalCompassDirection,
  CompassDirection,
  CompassDirectionByPointByGroup,
  CompassDirectionGroup,
  HasCardinalComponent,
} from '../geometry/compass';
import { Geometry } from '../geometry/geometry';
import { IPoint } from '../geometry/interfaces';
import { Point } from '../geometry/point';
import { AnalogDirectionButton, AnalogDirectionButtons, Button, Buttons, NonAnalogDirectionButtons } from './buttons';

export interface IGamepads {
  leftAnalogStickByIndex: { [gamepadId: number]: Point };
  rightAnalogStickByIndex: { [gamepadId: number]: Point };
  leftTriggerByIndex: { [gamepadId: number]: number };
  rightTriggerByIndex: { [gamepadId: number]: number };

  downByIndex: { [gamepadId: number]: { [button: string]: boolean } };
  pressedByIndex: {
    [gamepadId: number]: { [button: string]: boolean };
  };
  releasedByIndex: {
    [gamepadId: number]: { [button: string]: boolean };
  };

  down(button: Button, gamepadId?: number): boolean;
  pressed(button: Button, gamepadId?: number): boolean;
  released(button: Button, gamepadId?: number): boolean;
}

abstract class GamepadsBase implements IGamepads {
  leftAnalogStickByIndex: { [gamepadId: number]: Point } = {};
  rightAnalogStickByIndex: { [gamepadId: number]: Point } = {};
  leftTriggerByIndex: { [gamepadId: number]: number } = {};
  rightTriggerByIndex: { [gamepadId: number]: number } = {};

  downByIndex: { [gamepadId: number]: { [button: string]: boolean } } = {};
  pressedByIndex: {
    [gamepadId: number]: { [button: string]: boolean };
  } = {};
  releasedByIndex: {
    [gamepadId: number]: { [button: string]: boolean };
  } = {};

  private getButtonValue(
    valueByGamepadId: { [gamepadId: number]: { [button: string]: boolean } },
    button: Button,
    gamepadId: number = 0
  ): boolean {
    return valueByGamepadId?.[gamepadId]?.[button] ?? false;
  }

  public down(button: Button, gamepadId: number = 0): boolean {
    return this.getButtonValue(this.downByIndex, button, gamepadId);
  }

  public pressed(button: Button, gamepadId: number = 0): boolean {
    return this.getButtonValue(this.pressedByIndex, button, gamepadId);
  }

  public released(button: Button, gamepadId: number = 0): boolean {
    return this.getButtonValue(this.releasedByIndex, button, gamepadId);
  }
}

export class GamepadsSnapshot extends GamepadsBase {
  public update(snapshot: IGamepads): this {
    this.leftAnalogStickByIndex = { ...snapshot.leftAnalogStickByIndex };
    this.rightAnalogStickByIndex = { ...snapshot.rightAnalogStickByIndex };
    this.leftTriggerByIndex = { ...snapshot.leftTriggerByIndex };
    this.rightTriggerByIndex = { ...snapshot.rightTriggerByIndex };

    this.downByIndex = { ...snapshot.downByIndex };
    this.pressedByIndex = { ...snapshot.pressedByIndex };
    this.releasedByIndex = { ...snapshot.releasedByIndex };

    return this;
  }

  /**
   * Turns off all active inputs in the snapshot
   */
  public reset(): this {
    for (const property in this.leftAnalogStickByIndex)
      if (this.leftAnalogStickByIndex.hasOwnProperty(property)) delete this.leftAnalogStickByIndex[property];
    for (const property in this.rightAnalogStickByIndex)
      if (this.rightAnalogStickByIndex.hasOwnProperty(property)) delete this.rightAnalogStickByIndex[property];
    for (const property in this.leftTriggerByIndex)
      if (this.leftTriggerByIndex.hasOwnProperty(property)) delete this.leftTriggerByIndex[property];
    for (const property in this.rightTriggerByIndex)
      if (this.rightTriggerByIndex.hasOwnProperty(property)) delete this.rightTriggerByIndex[property];

    for (const property in this.downByIndex)
      if (this.downByIndex.hasOwnProperty(property)) delete this.downByIndex[property];
    for (const property in this.pressedByIndex)
      if (this.pressedByIndex.hasOwnProperty(property)) delete this.pressedByIndex[property];
    for (const property in this.releasedByIndex)
      if (this.releasedByIndex.hasOwnProperty(property)) delete this.releasedByIndex[property];

    return this;
  }
}

export class Gamepads extends GamepadsBase {
  public active = true;

  private readonly gamepadIndices = [0, 1, 2, 3];

  private static readonly TriggerBuffer: number = 0.1;
  private static readonly DeadzoneDefault = 0.3;
  private get gamepads(): { [gamepadId: number]: Gamepad } {
    const gamepadsRaw = navigator.getGamepads();
    const connectedGamepadByIndex: { [gamepadId: number]: Gamepad } = {};
    for (let index of this.gamepadIndices) {
      const gamepad = gamepadsRaw[index];
      if (gamepad != null && gamepad.connected) connectedGamepadByIndex[index] = gamepad;
    }
    return connectedGamepadByIndex;
  }

  public static get AreAvailable(): boolean {
    return !!navigator.getGamepads;
  }
  public static readonly ButtonMappings = [
    [Button.A],
    [Button.B],
    [Button.X],
    [Button.Y],
    [Button.LB],
    [Button.RB],
    [Button.LT],
    [Button.RT],
    [Button.SELECT, Button.BACK],
    [Button.START],
    [Button.L3],
    [Button.R3],
    [Button.UP],
    [Button.DOWN],
    [Button.LEFT],
    [Button.RIGHT],
    // 16 - ???
  ];

  public hasInputThisFrame = false;

  constructor() {
    super();
  }

  destroy() {}
  start() {}

  reset() {
    for (const key in this.leftAnalogStickByIndex)
      this.leftAnalogStickByIndex[key].x = this.leftAnalogStickByIndex[key].y = 0;
    for (const key in this.rightAnalogStickByIndex)
      this.rightAnalogStickByIndex[key].x = this.rightAnalogStickByIndex[key].y = 0;
    for (const key in this.leftTriggerByIndex) this.leftTriggerByIndex[key] = 0;
    for (const key in this.rightTriggerByIndex) this.rightTriggerByIndex[key] = 0;
    for (const gamepadId in this.downByIndex) {
      const value = this.downByIndex[gamepadId];
      for (const button in value) value[button] = false;
    }
    for (const gamepadId in this.pressedByIndex) {
      const value = this.pressedByIndex[gamepadId];
      for (const button in value) value[button] = false;
    }
    for (const gamepadId in this.releasedByIndex) {
      const value = this.releasedByIndex[gamepadId];
      for (const button in value) value[button] = false;
    }

    this.hasInputThisFrame = false;
  }

  // only works in chrome
  // https://gitlab.com/gilrs-project/gilrs/-/issues/81
  vibrate(duration: number, weakMagnitude: number = 1, strongMagnitude: number = 1, gamepadId: number = 0) {
    const gamepad = this.gamepads[gamepadId];
    if (gamepad) {
      (gamepad as any).vibrationActuator.playEffect('dual-rumble', {
        duration,
        weakMagnitude,
        strongMagnitude,
      });
    }
  }

  update() {
    if (!this.active) return;

    this.hasInputThisFrame = false;

    if (!Gamepads.AreAvailable) return;

    const gamepads = this.gamepads;
    for (const gamepadId in gamepads) {
      const gamepad = gamepads[gamepadId];
      if (gamepad == null) return;

      this.leftAnalogStickByIndex[gamepadId] = this.applyDeadzone(new Point(gamepad.axes[0], gamepad.axes[1]));
      this.rightAnalogStickByIndex[gamepadId] = this.applyDeadzone(new Point(gamepad.axes[2], gamepad.axes[3]));
      this.leftTriggerByIndex[gamepadId] = gamepad.buttons[6].value;
      this.rightTriggerByIndex[gamepadId] = gamepad.buttons[7].value;

      if (!(gamepadId in this.downByIndex)) this.downByIndex[gamepadId] = {};
      if (!(gamepadId in this.pressedByIndex)) this.pressedByIndex[gamepadId] = {};
      if (!(gamepadId in this.releasedByIndex)) this.releasedByIndex[gamepadId] = {};

      for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
        const buttons = Gamepads.ButtonMappings[buttonIndex] ?? [];
        const wasDown = this.downByIndex[gamepadId]?.[buttons[0]] ?? false;
        const isDown =
          buttonIndex == 6 || buttonIndex == 7
            ? gamepad.buttons[buttonIndex].value > Gamepads.TriggerBuffer
            : gamepad.buttons[buttonIndex].pressed;
        const isPressed = isDown && !wasDown;
        const isReleased = !isDown && wasDown;

        for (const button of buttons) {
          this.downByIndex[gamepadId][button] = isDown;
          this.pressedByIndex[gamepadId][button] = isPressed;
          this.releasedByIndex[gamepadId][button] = isReleased;
        }

        if (isDown) this.hasInputThisFrame = true;
      }

      for (const button of AnalogDirectionButtons) {
        const wasDown = this.downByIndex[gamepadId]?.[button] ?? false;
        const isDown = this.isAnalogDirectionDownByButton[button](Number(gamepadId));
        const isPressed = isDown && !wasDown;
        const isReleased = !isDown && wasDown;
        this.downByIndex[gamepadId][button] = isDown;
        this.pressedByIndex[gamepadId][button] = isPressed;
        this.releasedByIndex[gamepadId][button] = isReleased;

        if (isDown) this.hasInputThisFrame = true;
      }
    }
  }

  private analogHasCardinalComponent = (
    analogStick: IPoint,
    cardinalComponent: CardinalCompassDirection,
    compassDirectionGroup: CompassDirectionGroup
  ) => {
    const len = Geometry.Point.LengthSq(analogStick);
    if (Geometry.IsWithinToleranceOf(len, 0)) return false;
    const compassDirection = CompassDirectionByPointByGroup[compassDirectionGroup](analogStick.x, analogStick.y);
    return HasCardinalComponent(compassDirection, cardinalComponent);
  };
  private isAnalogDirectionDownByButton: {
    [key in AnalogDirectionButton]: (gamepadId: number) => boolean;
  } = {
    [Button.LEFT_ANALOG_UP]: gamepadId => this.leftAnalogStickByIndex[gamepadId].y < 0,
    [Button.LEFT_ANALOG_RIGHT]: gamepadId => this.leftAnalogStickByIndex[gamepadId].x > 0,
    [Button.LEFT_ANALOG_DOWN]: gamepadId => this.leftAnalogStickByIndex[gamepadId].y > 0,
    [Button.LEFT_ANALOG_LEFT]: gamepadId => this.leftAnalogStickByIndex[gamepadId].x < 0,

    [Button.LEFT_ANALOG_UP_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.N,
        CompassDirectionGroup.ALL
      ),
    [Button.LEFT_ANALOG_RIGHT_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.E,
        CompassDirectionGroup.ALL
      ),
    [Button.LEFT_ANALOG_DOWN_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.S,
        CompassDirectionGroup.ALL
      ),
    [Button.LEFT_ANALOG_LEFT_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.W,
        CompassDirectionGroup.ALL
      ),

    [Button.LEFT_ANALOG_UP_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.N,
        CompassDirectionGroup.CARDINAL
      ),
    [Button.LEFT_ANALOG_RIGHT_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.E,
        CompassDirectionGroup.CARDINAL
      ),
    [Button.LEFT_ANALOG_DOWN_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.S,
        CompassDirectionGroup.CARDINAL
      ),
    [Button.LEFT_ANALOG_LEFT_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.leftAnalogStickByIndex[gamepadId],
        CompassDirection.W,
        CompassDirectionGroup.CARDINAL
      ),

    [Button.RIGHT_ANALOG_UP]: gamepadId => this.rightAnalogStickByIndex[gamepadId].y < 0,
    [Button.RIGHT_ANALOG_RIGHT]: gamepadId => this.rightAnalogStickByIndex[gamepadId].x > 0,
    [Button.RIGHT_ANALOG_DOWN]: gamepadId => this.rightAnalogStickByIndex[gamepadId].y > 0,
    [Button.RIGHT_ANALOG_LEFT]: gamepadId => this.rightAnalogStickByIndex[gamepadId].x < 0,

    [Button.RIGHT_ANALOG_UP_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.N,
        CompassDirectionGroup.ALL
      ),
    [Button.RIGHT_ANALOG_RIGHT_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.E,
        CompassDirectionGroup.ALL
      ),
    [Button.RIGHT_ANALOG_DOWN_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.S,
        CompassDirectionGroup.ALL
      ),
    [Button.RIGHT_ANALOG_LEFT_8]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.W,
        CompassDirectionGroup.ALL
      ),

    [Button.RIGHT_ANALOG_UP_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.N,
        CompassDirectionGroup.CARDINAL
      ),
    [Button.RIGHT_ANALOG_RIGHT_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.E,
        CompassDirectionGroup.CARDINAL
      ),
    [Button.RIGHT_ANALOG_DOWN_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.S,
        CompassDirectionGroup.CARDINAL
      ),
    [Button.RIGHT_ANALOG_LEFT_4]: gamepadId =>
      this.analogHasCardinalComponent(
        this.rightAnalogStickByIndex[gamepadId],
        CompassDirection.W,
        CompassDirectionGroup.CARDINAL
      ),
  };

  private applyDeadzone(value: Point, deadzone: number | null = null) {
    const deadzoneFinal = deadzone != null ? deadzone : Gamepads.DeadzoneDefault;
    if (Geometry.Point.DistanceSq(value, Geometry.Point.Zero) < deadzoneFinal * deadzoneFinal) value.x = value.y = 0;
    return value;
  }

  leftAnalogStick(gamepadId: number = 0): IPoint {
    return this.leftAnalogStickByIndex?.[gamepadId] ?? new Point();
  }

  rightAnalogStick(gamepadId: number = 0): IPoint {
    return this.rightAnalogStickByIndex?.[gamepadId] ?? new Point();
  }

  leftTrigger(gamepadId: number = 0): number {
    return this.leftTriggerByIndex?.[gamepadId] ?? 0;
  }

  rightTrigger(gamepadId: number = 0): number {
    return this.rightTriggerByIndex?.[gamepadId] ?? 0;
  }

  hasInput(gamepadId: number = 0): boolean {
    return (
      this.leftTrigger(gamepadId) != 0 ||
      this.rightTrigger(gamepadId) != 0 ||
      Geometry.Point.LengthSq(this.leftAnalogStick(gamepadId)) > 0 ||
      Geometry.Point.LengthSq(this.rightAnalogStick(gamepadId)) > 0 ||
      Object.values(this.pressedByIndex[gamepadId] || {}).any(o => o) ||
      Object.values(this.releasedByIndex[gamepadId] || {}).any(o => o)
    );
  }

  allNonAnalogDown(gamepadId: number = 0): Exclude<Button, AnalogDirectionButton>[] {
    return NonAnalogDirectionButtons.filter(button => this.down(button, gamepadId));
  }

  allNonAnalogPressed(gamepadId: number = 0): Exclude<Button, AnalogDirectionButton>[] {
    return NonAnalogDirectionButtons.filter(button => this.pressed(button, gamepadId));
  }

  allNonAnalogReleased(gamepadId: number = 0): Exclude<Button, AnalogDirectionButton>[] {
    return NonAnalogDirectionButtons.filter(button => this.released(button, gamepadId));
  }

  allDown(gamepadId: number = 0): Button[] {
    return Buttons.filter(button => this.down(button, gamepadId));
  }

  allPressed(gamepadId: number = 0): Button[] {
    return Buttons.filter(button => this.pressed(button, gamepadId));
  }

  allReleased(gamepadId: number = 0): Button[] {
    return Buttons.filter(button => this.released(button, gamepadId));
  }
}
