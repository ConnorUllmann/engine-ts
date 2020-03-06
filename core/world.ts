import { Entity } from './entity';
import { Camera } from './camera';
import { Mouse } from './mouse';
import { Color } from '../visuals/color';
import { Keyboard } from './keyboard';
import { Gamepads } from './gamepads';

export class World {
    public readonly canvas: HTMLCanvasElement;
    public readonly context: CanvasRenderingContext2D;

    public readonly camera: Camera;
    public readonly mouse: Mouse;
    public readonly keyboard: Keyboard;
    public readonly gamepads: Gamepads;

    public readonly entities: Entity[] = [];
    public readonly entityById: { [id: number]: Entity } = {};
    public readonly entitiesByClass: { [key: string]: Entity[] } = {};

    private readonly entityToAddById: { [id: number]: Entity } = {};
    private readonly entityToRemoveById: { [id: number]: Entity } = {};

    private nextEntityId: number = 0;

    public paused: boolean = false;
    public fps: number = 60;
    public get millisecondsPerFrame(): number { return 1000 / this.fps; }
    public get millisecondsSinceStart(): number { return Date.now() - this.firstUpdateTimestamp; }
    public firstUpdateTimestamp: number = 0;
    public lastUpdateTimestamp: number = 0;
    private _delta: number = 0;
    public get delta(): number { return this._delta; }
    public get deltaNormal(): number { return this._delta / this.millisecondsPerFrame; }

    public backgroundColor: Color = Color.lightGrey;

    // create in ngOnInit and not in the component's constructor
    constructor(
        canvasId: string,
        canvasWidth: number = 640,
        canvasHeight: number = 480,
        canvasResolutionWidth: number = 1280,
        canvasResolutionHeight: number = 960,
        alpha: boolean=true
    ) {
        console.log(`World started using canvas with id '${canvasId}'`);
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if(this.canvas == null)
            throw `Canvas '${canvasId}' does not exist`;
        if(!this.canvas.getContext)
            throw `Cannot retrieve canvas context for '${canvasId}'`;
        this.context = this.canvas.getContext('2d', { alpha });
        this.canvas.oncontextmenu = () => false;

        this.setCanvasSize(canvasWidth, canvasHeight);
        this.setCanvasResolution(canvasResolutionWidth, canvasResolutionHeight);
        
        this.camera = new Camera(this);
        this.mouse = new Mouse(this);
        this.keyboard = new Keyboard();
        this.gamepads = new Gamepads();

        this.mouse.start();
        this.keyboard.start();

        setInterval(() => this.updateFrame(), this.millisecondsPerFrame);
    }

    private setCanvasSize(width: number, height: number) {
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    private setCanvasResolution(width: number, height: number) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    private updateFrame(): void {
        if(this.paused)
            return;
            
        this.updateDelta();
        this.updateEntities();
        this.clearCanvas(this.backgroundColor);
        this.renderEntities();
        this.mouse.update();
        this.keyboard.update();
        this.gamepads.update();
    }

    private updateDelta(): void {
        if(this.firstUpdateTimestamp == null)
            this.firstUpdateTimestamp = Date.now();
        const now = Date.now();
        this._delta = now - this.lastUpdateTimestamp;
        this.lastUpdateTimestamp = now;
    }

    private updateEntities(): void {
        for(const id in this.entityToAddById) {
            const entity = this.entityToAddById[id];
            delete this.entityToAddById[id];
            
            this.entities.push(entity);
            this.entityById[id] = entity;
            if(!(entity.class in this.entitiesByClass)) {
                this.entitiesByClass[entity.class] = [];
            }
            this.entitiesByClass[entity.class].push(entity);
        }

        this.sortEntitiesByUpdateOrder();

        const entities = this.entities.filter((o: Entity) => o.active);
        entities.forEach((o: Entity) => o.update());
        entities.forEach((o: Entity) => o.postUpdate());

        for(const id in this.entityToRemoveById) {
            const entity = this.entityToRemoveById[id];
            delete this.entityToRemoveById[id];

            this.entities.remove(entity);
            delete this.entityById[entity.id];
            this.entitiesByClass[entity.class].remove(entity);

            entity.removed();
            entity.destroyed = true;
        }
    }

    private renderEntities() {
        this.sortEntitiesByUpdateOrder();

        const entities = this.entities.filter(o => o.visible);
        entities.forEach((o: Entity) => o.render());
    }

    public addEntity(entity: Entity) {
        if(entity.world != this)
            return;
        entity.id = this.nextEntityId++;
        this.entityToAddById[entity.id] = entity;
    }

    public destroyEntity(entity: Entity) {
        if(entity.world != this || entity.destroyed)
            return;
        this.entityToRemoveById[entity.id] = entity;
    }

    public clearCanvas(color: Color | null=null) {
        if(color == null) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        this.context.fillStyle = color.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private sortEntitiesByUpdateOrder() {
        this.entities.sort(this.compareUpdateOrders);
    }

    private compareUpdateOrders(a: Entity, b: Entity): number {
        return a.depth === b.depth
            ? a.id - b.id
            : b.depth - a.depth;
    };
}