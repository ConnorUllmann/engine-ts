// When a variable is moving toward a target with a specific "percent per frame", (e.g. move 20% of the distance between your current value and your target value)
// variable frame rates require that partial frames be taken into account. (i.e. moving 20% of the distance, but we're not running full FPS so we need to simulate 1.2x that action this frame)
// This function takes in the percent to move (0.2) as well as the current "deltaNormal" (the number of frames to simulate, i.e. 60 FPS target but at 30 FPS right now? then deltaNormal=2)

export const percentWithDelta = (percent: number, deltaNormal: number) => 1 - Math.pow(1 - percent, deltaNormal);
// e.g. the following will move x towards 100 at 20% per frame even with a variable frame rate
// x += (100 - x) * percentWithDelta(0.2, deltaNormal)

// This version is useful for contexts where you're not adding to a value every frame, but rather multiplying it directly by a value every frame
export const frictionWithDelta = (friction: number, deltaNormal: number) =>
  1 - percentWithDelta(1 - friction, deltaNormal);
// e.g. the following will reduce x by 10% every frame even with a variable frame rate
// x *= frictionWithDelta(0.9, deltaNormal)

// Here is the proof this works for a given multiplication assignment operation "x *= 0.9":
// x *= 0.9
// x = x * 0.9
// x += -x * 0.1
// x += -x * (1 - 0.9)
// x += (0 - x) * (1 - 0.9)

// at this point, we apply percentWithDelta to this familiar shape of assignment operation!
// x += (0 - x) * percentWithDelta((1 - 0.9), deltaNormal)

// x += -x * percentWithDelta((1 - 0.9), deltaNormal)
// x = x - x * percentWithDelta((1 - 0.9), deltaNormal)
// x = x * (1 - percentWithDelta((1 - 0.9), deltaNormal))
// x *= 1 - percentWithDelta((1 - 0.9), deltaNormal)
