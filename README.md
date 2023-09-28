# engine-ts

`engine-ts` is a browser-based 2D game engine written in Typescript.

## Setup

Create a `canvas` element in your HTML with an ID:

```html
<canvas id="myCanvas"></canvas>
```

Then, in your Typescript, instantiate an instance of `World` with the ID of your canvas element. For example, the below line will start a 60 frames/sec game loop on a 640x480 resolution canvas:

```typescript
import { World } from './engine-ts/core/world';

const world = new World('myCanvas', 640, 480);
```

By defining child classes based on the provided `Entity` class, you can create objects that automatically update and draw every frame:

```typescript
import { Entity } from './engine-ts/core/entity';
import { Key } from './engine-ts/core/keys';
import { Color } from './engine-ts/visuals/color';
import { Draw } from './engine-ts/visuals/draw';

class Player extends Entity {
  private speed = 4;

  update() {
    if (Key.LEFT in this.world.keyboard.down) this.position.x -= this.speed;
    if (Key.RIGHT in this.world.keyboard.down) this.position.x += this.speed;
    if (Key.UP in this.world.keyboard.down) this.position.y -= this.speed;
    if (Key.DOWN in this.world.keyboard.down) this.position.y += this.speed;
  }

  draw() {
    Draw.Explicit.Circle(this.world, this.position.x, this.position.y, 5, Color.red);
  }
}
```

This creates a basic "player" entity class that will appear as a red circle that the user can control using the arrow keys. Create an instance of this class and pass in the `World` reference to have it automatically added to the world for updating/drawing:

```typescript
const player = new Player(world, { x: 200, y: 100 });
```

To destroy an entity, call its `destroy()` method and it will be cleaned up at the end of the frame.

```typescript
player.destroy();
```

## Features

- Input management
  - Keyboard
  - Mouse
  - Gamepad
- Camera management
- Image & Animation management
- Colliders
- Sounds & music management
- Drawing support methods
- Geometry utility methods
  - Shape collision & intersections
  - Angle, Point, Line, Triangle, Rectangle, Polygon, etc. utility functions
- Various tools
  - Easers
  - Quad trees
  - State machines
  - Pathfinding
  - Verlet implementation
  - Markov chains
  - Pools
