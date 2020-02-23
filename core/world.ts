import { Entity } from './entity';
import { Camera } from './camera';
import { Mouse } from './mouse';
import { Color } from '../visuals/color';

export class World {
    public canvas: HTMLCanvasElement;
    public context: CanvasRenderingContext2D;

    public camera: Camera;
    public mouse: Mouse;

    public entities: Entity[] = [];
    public entityById: { [id: number]: Entity } = {};
    public entitiesByClass: { [key: string]: Entity[] } = {};

    private entityToAddById: { [id: number]: Entity } = {};
    private entityToRemoveById: { [id: number]: Entity } = {};

    private nextEntityId: number = 0;

    public paused: boolean = false;
    public fps: number = 60;
    public get millisecondsPerFrame(): number { return 1000 / this.fps; }

    public backgroundColor: Color = Color.lightGrey;

    constructor() {}

    public start(canvasId: string, alpha: boolean=true): World {
        console.log(`World started using canvas with id '${canvasId}'`);
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if(this.canvas == null)
            throw `Canvas '${canvasId}' does not exist`;
        if(!this.canvas.getContext)
            throw `Cannot retrieve canvas context for '${canvasId}'`;
        this.context = this.canvas.getContext('2d', { alpha });
        
        this.camera = new Camera(this);
        this.mouse = new Mouse(this);

        this.mouse.start();

        setInterval(() => this.updateFrame(), this.millisecondsPerFrame);
        return this;
    }

    public updateFrame(): void {
        if(this.paused)
            return;
        
        this.updateEntities();
        this.clearCanvas(this.backgroundColor);
        this.renderEntities();
        this.mouse.update();
    }

    public updateEntities(): void {
        for(const id in this.entityToAddById) {
            const entity = this.entityToAddById[id];
            delete this.entityToAddById[id];
            
            this.entities.push(entity);
            this.entityById[id] = entity;
            if(!(entity.class in this.entitiesByClass)) {
                this.entitiesByClass[entity.class] = [];
            }
            this.entitiesByClass[entity.class].push(entity);

            entity.added();
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

    public renderEntities(): void {
        this.sortEntitiesByUpdateOrder();

        const entities = this.entities.filter(o => o.visible);
        entities.forEach((o: Entity) => o.render());
    }

    public addEntity(entity: Entity): boolean {
        if(entity.id != null)
            return false;
        entity.id = this.nextEntityId++;
        entity.world = this;
        this.entityToAddById[entity.id] = entity;
    }

    public destroyEntity(entity: Entity): void {
        if(!entity.destroyed)
            this.entityToRemoveById[entity.id] = entity;
    }

    public clearCanvas(color: Color | null=null): void {
        if(color == null) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        this.context.fillStyle = color.toString();
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private sortEntitiesByUpdateOrder(): void {
        this.entities.sort(this.compareUpdateOrders);
    }

    private compareUpdateOrders(a: Entity, b: Entity): number {
        return a.depth === b.depth
            ? a.id - b.id
            : b.depth - a.depth;
    };
}