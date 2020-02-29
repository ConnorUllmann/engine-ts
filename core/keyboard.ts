import { Key } from './keys';

export class Keyboard {
    public down: { [id: string]: boolean } = {};
    public pressed: { [id: string]: boolean }  = {};
    public released: { [id: string]: boolean }  = {};

    constructor() {}
    
    start() {
        const keyboard = this;
        document.addEventListener("keydown", (e: KeyboardEvent) => {
            if(!e.repeat)
                keyboard.setKeyDown(e.keyCode, e.code);
        }, false);
        document.addEventListener("keyup", (e: KeyboardEvent) => {
            if(!e.repeat)
                keyboard.setKeyUp(e.keyCode, e.code);
        }, false);

        // Allows keyboard events to be passed into the game when it is inside an <iframe/>
        // e.g. document.getElementById('gameIframe').contentWindow.postMessage('down|16|ShiftLeft', '*')
        window.addEventListener('message', (e: MessageEvent) => {
            const commands = typeof e.data === 'string' ? e.data.split('|') : [];
            const keyCode = !commands[1] || commands[1] === '' ? null : Number(commands[1]);
            const code = !commands[2] || commands[2] === '' ? null : commands[2];
            if(commands[0] === 'down')
                keyboard.setKeyDown(keyCode, code);
            if(commands[0] === 'up')
                keyboard.setKeyUp(keyCode, code);
        }, false);
    };

    setKeyDown(keyCode: number, code: string | null=null) {
        const keys = Keyboard.keysForKeyEvent(keyCode, code);
        for(let i = 0; i < keys.length; i++)
        {
            let key = keys[i];
            this.pressed[key] = true;
            this.down[key] = true;
        }
    };

    setKeyUp(keyCode: number, code: string | null=null) {
        const keys = Keyboard.keysForKeyEvent(keyCode, code);
        for(let i = 0; i < keys.length; i++)
        {
            let key = keys[i];
            this.released[key] = true;
            if(this.down.hasOwnProperty(key))
                delete this.down[key];
        }
    };

    update() {
        for(const property in this.pressed)
            if(this.pressed.hasOwnProperty(property))
                delete this.pressed[property];

        for(const property in this.released)
            if(this.released.hasOwnProperty(property))
                delete this.released[property];
    };

    private static keysForKeyEvent(keyCode: number, code: string | null=null): (string | number)[] {
        let key = String.fromCharCode(keyCode);
        let result = [keyCode, key.toLowerCase()];

        if (keyCode in Keyboard.NamedKeysMap)
            result.push(...Keyboard.NamedKeysMap[keyCode]);

        switch(keyCode)
        {
            case 13:
                if(code === 'Enter')
                    result.push(Key.ENTER, Key.RETURN);
                if(code === 'NumpadEnter')
                    result.push(Key.NUMPAD_ENTER);
                break;
            case 16:
                if (code === 'ShiftLeft')
                    result.push(Key.LSHIFT);
                else if (code === 'ShiftRight')
                    result.push(Key.RSHIFT);
                break;
            case 17:
                if (code === 'ControlLeft')
                    result.push(Key.LCTRL);
                else if (code === 'ControlRight')
                    result.push(Key.RCTRL);
                break;
            case 18:
                if (code === 'AltLeft')
                    result.push(Key.LALT);
                else if (code === 'AltRight')
                    result.push(Key.RALT);
                break;
            case 46:
                if (code === 'NumpadDecimal')
                    result.push(Key.NUMPAD_DECIMAL);
                else if (code === 'Delete')
                    result.push(Key.DELETE);
                break;
        }
        return result;
    };

    public static readonly NamedKeysMap = {
        8: [Key.BACKSPACE],
        9: [Key.TAB],
        16: [Key.SHIFT],
        17: [Key.CTRL],
        18: [Key.ALT],
        19: [Key.PAUSE_BREAK],
        20: [Key.CAPS],
        27: [Key.ESC],
        32: [Key.SPACE],
        33: [Key.PAGE_UP],
        34: [Key.PAGE_DOWN],
        35: [Key.END],
        36: [Key.HOME],
        37: [Key.LEFT],
        38: [Key.UP],
        39: [Key.RIGHT],
        40: [Key.DOWN],
        45: [Key.INSERT],
        48: [Key.ZERO, Key.CLOSE_PAREN],
        49: [Key.ONE, Key.BANG, Key.EXCLAMATION_POINT],
        50: [Key.TWO, Key.AT],
        51: [Key.THREE, Key.HASH, Key.POUND],
        52: [Key.FOUR, Key.DOLLAR],
        53: [Key.FIVE, Key.PERCENT],
        54: [Key.SIX, Key.CARET, Key.UP_CARET],
        55: [Key.SEVEN, Key.AMPERSAND],
        56: [Key.EIGHT, Key.ASTERISK],
        57: [Key.NINE, Key.OPEN_PAREN],
        65: [Key.A],
        66: [Key.B],
        67: [Key.C],
        68: [Key.D],
        69: [Key.E],
        70: [Key.F],
        71: [Key.G],
        72: [Key.H],
        73: [Key.I],
        74: [Key.J],
        75: [Key.K],
        76: [Key.L],
        77: [Key.M],
        78: [Key.N],
        79: [Key.O],
        80: [Key.P],
        81: [Key.Q],
        82: [Key.R],
        83: [Key.S],
        84: [Key.T],
        85: [Key.U],
        86: [Key.V],
        87: [Key.W],
        88: [Key.X],
        89: [Key.Y],
        90: [Key.Z],
        91: [Key.LEFT_WINDOWS],
        92: [Key.RIGHT_WINDOWS],
        93: [Key.CONTEXT_MENU, Key.SELECT],
        96: [Key.NUMPAD_ZERO],
        97: [Key.NUMPAD_ONE],
        98: [Key.NUMPAD_TWO],
        99: [Key.NUMPAD_THREE],
        100: [Key.NUMPAD_FOUR],
        101: [Key.NUMPAD_FIVE],
        102: [Key.NUMPAD_SIX],
        103: [Key.NUMPAD_SEVEN],
        104: [Key.NUMPAD_EIGHT],
        105: [Key.NUMPAD_NINE],
        106: [Key.NUMPAD_MULTIPLY],
        107: [Key.NUMPAD_ADD],
        109: [Key.NUMPAD_SUBTRACT],
        110: [Key.NUMPAD_DECIMAL],
        111: [Key.NUMPAD_DIVIDE],
        112: [Key.F1],
        113: [Key.F2],
        114: [Key.F3],
        115: [Key.F4],
        116: [Key.F5],
        117: [Key.F6],
        118: [Key.F7],
        119: [Key.F8],
        120: [Key.F9],
        121: [Key.F10],
        122: [Key.F11],
        123: [Key.F12],
        144: [Key.NUM_LOCK],
        145: [Key.SCROLL_LOCK],
        186: [Key.SEMI_COLON, Key.COLON],
        187: [Key.EQUALS, Key.PLUS],
        188: [Key.COMMA, Key.LEFT_CARET],
        189: [Key.DASH, Key.HYPHEN, Key.UNDERSCORE],
        190: [Key.PERIOD, Key.RIGHT_CARET],
        191: [Key.FORWARD_SLASH, Key.QUESTION_MARK],
        192: [Key.TICK, Key.TILDA],
        219: [Key.OPEN_SQUARE_BRACKET, Key.OPEN_CURLY_BRACKET],
        220: [Key.BACK_SLASH, Key.BAR, Key.PIPE],
        221: [Key.CLOSE_SQUARE_BRACKET, Key.CLOSE_CURLY_BRACKET],
        222: [Key.DOUBLE_QUOTE, Key.SINGLE_QUOTE, Key.APOSTROPHE]
    };
}