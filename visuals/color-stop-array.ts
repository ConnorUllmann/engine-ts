import { Color } from './color';
import { clamp } from '../core/utils';

/* Color Stops - used for gradients */
export class ColorStop {
    constructor(public color: Color, public stop: number) {}

    public applyToGradient(gradient: CanvasGradient) {
        gradient.addColorStop(this.stop, this.color.toString());
    }
}

export class ColorStopArray {
    constructor(private colorStops: ColorStop[]) {
        if(colorStops.length < 2)
            throw 'Cannot create ColorStopList with less than two colors';
        if(colorStops.first().stop !== 0)
            throw 'First ColorStop must have stop=0';
        if(colorStops.last().stop !== 1)
            throw 'Last ColorStop must have stop=1';
        if(colorStops.any(o => o.stop < 0 || o.stop > 1))
            throw 'All ColorStops must have 0 <= stop <= 1';
    }

    // Example: creates a ColorStopArray which will go from red to green to blue,
    //  where the red to green transition is faster than the green to blue.
    // ColorStopArray.create(
    //      new ColorStop(Color.red, 0),
    //      new ColorStop(Color.green, 0.4),
    //      new ColorStop(Color.blue, 1));
    public static create(...colorStops: ColorStop[]): ColorStopArray {
        return new ColorStopArray(colorStops);
    };

    // Example: creates a ColorStopArray which will go from red to green to blue
    // ColorStopArray.createEvenlySpaced(
    //      Color.red,
    //      Color.green,
    //      Color.blue);
    public static createEvenlySpaced(...colors: Color[]): ColorStopArray {
        if(colors.length < 2)
            throw 'Cannot create ColorStopList with less than two colors';
        const colorStops = [];
        for(let i = 0; i < colors.length; i++)
        {
            const color = colors[i];
            const stop = i / (colors.length - 1);
            const colorStop = new ColorStop(color, stop);
            colorStops.push(colorStop);
        }
        return new ColorStopArray(colorStops);
    };

    public applyToGradient(gradient: CanvasGradient) {
        this.colorStops.forEach(o => o.applyToGradient(gradient));
    }

    // Returns the color from the gradient at the given position [0..1] given the ColorStops in this ColorStopArray
    //
    // Example:
    // ColorStopArray.createEvenlySpaced(
    //      Color.red,
    //      Color.green,
    //      Color.blue)
    //  .sample(0.25) === new Color(127, 127, 0)
    public sample(normal: number): Color {
        if(normal <= 0)
            return this.colorStops.first().color;
        if(normal >= 1)
            return this.colorStops.last().color;
        for(let j = 0; j < this.colorStops.length-1; j++)
        {
            const colorStop = this[j];
            const colorStopNext = this[j+1];
            if(normal >= colorStop.stop && normal <= colorStopNext.stop)
            {
                const colorStopNormal = clamp((normal - colorStop.stop) / (colorStopNext.stop - colorStop.stop), 0, 1);
                return colorStop.color.lerp(colorStopNext.color, colorStopNormal);
            }
        }
    }
}