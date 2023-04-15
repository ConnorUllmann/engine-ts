// When a variable is moving toward a target with a specific "percent per frame", (e.g. move 20% of the distance between your current value and your target value)
// variable frame rates require that partial frames be taken into account. (i.e. moving 20% of the distance, but we're not running full FPS so we need to simulate 1.2x that action this frame)
// This function takes in the percent to move (0.2) as well as the current "deltaNormal" (the number of frames to simulate, i.e. 60 FPS target but at 30 FPS right now? then deltaNormal=2)

export const percentWithDelta = (percent: number, deltaNormal: number) => 1 - Math.pow(1 - percent, deltaNormal);
