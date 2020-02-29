import { Point } from '@engine-ts/geometry/point';
import { IPoint } from '@engine-ts/geometry/interfaces';
import { Button } from './buttons';

export class Gamepads {
    private leftAnalogStickByIndex: { [gamepadId: number]: Point } = {};
    private rightAnalogStickByIndex: { [gamepadId: number]: Point } = {};
    private leftTriggerByIndex: { [gamepadId: number]: number } = {};
    private rightTriggerByIndex: { [gamepadId: number]: number } = {};

    private downByIndex: { [gamepadId: number]: { [button: string]: boolean} } = {};
    private pressedByIndex: { [gamepadId: number]: { [button: string]: boolean} } = {};
    private releasedByIndex: { [gamepadId: number]: { [button: string]: boolean} } = {};

    private static readonly DeadzoneDefault = 0.2;
    private get gamepads(): { [gamepadId: number]: Gamepad } {
        const gamepadsRaw = navigator.getGamepads();
        // since navigator.getGamepads() doesn't seem to return an actual array, access the controllers individually
        return [gamepadsRaw[0], gamepadsRaw[1], gamepadsRaw[2], gamepadsRaw[3]]
            .filter(o => o != null && o.connected)
            .mappedBy(o => o.index.toString());
    }

    public static get AreAvailable(): boolean { return !!(navigator.getGamepads); };
    public static readonly ButtonMappings = {
        0: [Button.A],
        1: [Button.B],
        2: [Button.X],
        3: [Button.Y],
        4: [Button.LB],
        5: [Button.RB],
        // 6 - left trigger
        // 7 - right trigger
        8: [Button.SELECT, Button.BACK],
        9: [Button.START],
        10: [Button.L3],
        11: [Button.R3],
        12: [Button.UP],
        13: [Button.DOWN],
        14: [Button.LEFT],
        15: [Button.RIGHT],
        // 16 - ???
    };

    constructor() {}

    public update() {
        if(!Gamepads.AreAvailable)
            return;

        const gamepads = this.gamepads;
        for(const gamepadId in gamepads)
        {
            const gamepad = gamepads[gamepadId];
            if (gamepad == null)
                return;

            this.leftAnalogStickByIndex[gamepadId] = new Point(this.applyDeadzone(gamepad.axes[0]), this.applyDeadzone(gamepad.axes[1]));
            this.rightAnalogStickByIndex[gamepadId] = new Point(this.applyDeadzone(gamepad.axes[2]), this.applyDeadzone(gamepad.axes[3]));
            this.leftTriggerByIndex[gamepadId] = gamepad.buttons[6].value;
            this.rightTriggerByIndex[gamepadId] = gamepad.buttons[7].value;

            if(!(gamepadId in this.downByIndex))
                this.downByIndex[gamepadId] = {};
            if(!(gamepadId in this.pressedByIndex))
                this.pressedByIndex[gamepadId] = {};
            if(!(gamepadId in this.releasedByIndex))
                this.releasedByIndex[gamepadId] = {};

            for(let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++)
            {
                if(buttonIndex === 6 || buttonIndex === 7)
                    continue;

                const buttons = this.tryGetValueOrDefaultFromDict(Gamepads.ButtonMappings, buttonIndex.toString(), []);
                const wasDown = this.tryGetValueOrDefaultFromDict(
                    this.tryGetValueOrDefaultFromDict(this.downByIndex, gamepadId, {}),
                    buttons[0],
                    false
                );
                const isDown = gamepad.buttons[buttonIndex].pressed;
                const isPressed = isDown && !wasDown;
                const isReleased = !isDown && wasDown;

                for(let button of buttons)
                {
                    this.downByIndex[gamepadId][button] = isDown;
                    this.pressedByIndex[gamepadId][button] = isPressed;
                    this.releasedByIndex[gamepadId][button] = isReleased;
                }
            }
        }
    };

    private tryGetValueOrDefaultFromDict<T>(dict: { [id: string]: T }, key: string, defaultValue: T): T {
        if(dict == null || !(key in dict))
            return defaultValue;
        const value = dict[key];
        if(value == null)
            return defaultValue;
        return value;
    };

    private applyDeadzone(value: number, deadzone: number=null) {
        const deadzoneFinal = deadzone != null ? deadzone : Gamepads.DeadzoneDefault;
        return Math.abs(value) >= deadzoneFinal
            ? Math.sign(value) * (Math.abs(value) - deadzoneFinal) / (1 - deadzoneFinal)
            : 0;
    };

    private getButtonValue(
        valueByGamepadId: { [gamepadId: number]: { [button: string]: boolean } }, 
        button: Button, 
        gamepadId:number=0
    ): boolean {
        return this.tryGetValueOrDefaultFromDict(
            this.tryGetValueOrDefaultFromDict(
                valueByGamepadId,
                gamepadId.toString(),
                {} as { [button: string]: boolean }
            ),
            button.toString(),
            false
        );
    };


    public leftAnalogStick(gamepadId: number=0): IPoint {
        return this.tryGetValueOrDefaultFromDict(this.leftAnalogStickByIndex, gamepadId.toString(), new Point());
    };

    public rightAnalogStick(gamepadId: number=0): IPoint {
        return this.tryGetValueOrDefaultFromDict(this.rightAnalogStickByIndex, gamepadId.toString(), new Point());
    };

    public leftTrigger(gamepadId: number=0): number {
        return this.tryGetValueOrDefaultFromDict(this.leftTriggerByIndex, gamepadId.toString(), 0);
    };

    public rightTrigger(gamepadId: number=0): number {
        return this.tryGetValueOrDefaultFromDict(this.rightTriggerByIndex, gamepadId.toString(), 0);
    };

    public down(button: Button, gamepadId: number=0): boolean {
        return this.getButtonValue(this.downByIndex, button, gamepadId);
    };

    public pressed(button: Button, gamepadId: number=0): boolean {
        return this.getButtonValue(this.pressedByIndex, button, gamepadId);
    };

    public released(button: Button, gamepadId: number=0): boolean {
        return this.getButtonValue(this.releasedByIndex, button, gamepadId);
    };

}