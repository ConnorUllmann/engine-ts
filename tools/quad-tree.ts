import { Actor } from "@engine-ts/core/actor";
import { Entity } from "@engine-ts/core/entity";
import { clamp, DeepReadonly } from "@engine-ts/core/utils";
import { World } from "@engine-ts/core/world";
import { Geometry } from "@engine-ts/geometry/geometry";
import { IRectangle } from "@engine-ts/geometry/interfaces";
import { IPoolable, Pool } from "./pool";

export class QuadTree {
    public rectangleById: { [id: number]: IRectangle };
    public pool: Pool<QuadNode>;
    public root: QuadNode;

    constructor(
        public world: World,
        public maxEntitiesPerNode: number,
        public minNodeSideLength: number,
        public x: number,
        public y: number,
        public w: number,
        public h: number,
    ) {
        this.rectangleById = {};
        this.pool = new Pool(() => new QuadNode(this, 0, 0, 0, 0), 10000);
        this.root = this.pool.get(x, y, w, h);        
    }

    reset() {
        this.rectangleById = {};
        this.root.destroy();
        this.pool.add(this.root);
        this.root = this.pool.get(this.x, this.y, this.w, this.h);
    };
    
    queryPoint(x: number, y: number): Set<number> {
        const ids = new Set<number>();
        this.root.queryPoint(x, y, ids);
        return ids;
    };
    
    queryRectangle(x: number, y: number, w: number, h: number): Set<number> {
        const ids = new Set<number>();
        this.root.queryRectangle(x, y, w, h, ids);
        return ids;
    };
    
    queryCircle(x: number, y: number, radius: number): Set<number> {
        return this.queryRectangle(x - radius, y - radius, radius * 2, radius * 2);
    };

    remove(id: number) {
        if(!(id in this.rectangleById))
            return;
        
        this.root.remove(id);
        delete this.rectangleById[id];
    }
    
    insert(id: number, rectangle: IRectangle): void {
        this.root.insert(id, rectangle);
    };
    
    insertEntity(entity: Entity, rectangle: IRectangle): void {
        this.insert(entity.id, rectangle);
    };
    
    insertActor(actor: Actor): void {
        this.insertEntity(actor, actor.bounds);
    };
    
    getLeafRectangles(): DeepReadonly<IRectangle[]> {
        const rectangles: IRectangle[] = [];
        const gatherRectangles = (node: QuadNode) => {
            if(node.hasChildren)
                node.children.forEach(o => gatherRectangles(o));
            else
                rectangles.push(node);
        };
        gatherRectangles(this.root);
        return rectangles;
    };
    
    getDepth(): number {
        let depth = 0;
        const applyNodeDepth = (node: QuadNode, depthTemp: number) => {
            depth = Math.max(depth, depthTemp);
            node.children.forEach(o => applyNodeDepth(o, depthTemp + 1));
        };
        applyNodeDepth(this.root, 0);
        return depth;
    };
    
    getNodeCount(): number {
        let nodeCount = 0;
        const addToNodeCount = (node: QuadNode) => {
            nodeCount++;
            node.children.forEach(o => addToNodeCount(o));
        };
        addToNodeCount(this.root);
        return nodeCount;
    };
}


// Intended to only be used by QuadTree internally
class QuadNode implements IRectangle, IPoolable
{
    public children: QuadNode[] = [];
    public ids = new Set<number>();

    constructor(public tree: QuadTree, public x: number, public y: number, public w: number, public h: number, public splitUsingMidpoint=true) {
        this.tree = tree;
        this.splitUsingMidpoint = splitUsingMidpoint;
    }

    get hasChildren(): boolean {
        return this.children.length > 0
    }

    reset(x: number, y: number, w: number, h: number): void {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.children.clear();
        this.ids.clear();
    };
    
    clone(): QuadNode {
        return this.tree.pool.get(this.x, this.y, this.w, this.h);
    };
    
    destroy(): void {
        this.children.forEach(o => o.destroy());
        this.tree.pool.add(this);
    };
    
    private splitCenter(): void {
        const wHalf = this.w/2;
        const hHalf = this.h/2;
        this.children = [
            this.tree.pool.get(this.x, this.y, wHalf, hHalf),
            this.tree.pool.get(this.x + wHalf, this.y, wHalf, hHalf),
            this.tree.pool.get(this.x, this.y + hHalf, wHalf, hHalf),
            this.tree.pool.get(this.x + wHalf, this.y + hHalf, wHalf, hHalf),
        ];
        this.passEntitiesToChildren();
    };
    
    private splitMidpoint(): void {        
        let midpoint = { x: 0, y: 0 };
        let count = 0;
        for(const id of this.ids) {
            const rectangle = this.tree.rectangleById[id];
            midpoint.x += rectangle.x + rectangle.w/2;
            midpoint.y += rectangle.y + rectangle.h/2;
            count++;
        }
        midpoint.x /= count;
        midpoint.y /= count;

        const xMin = this.x + this.tree.minNodeSideLength;
        const xMax = this.x + this.w - this.tree.minNodeSideLength;
        const yMin = this.y + this.tree.minNodeSideLength;
        const yMax = this.y + this.h - this.tree.minNodeSideLength;
        midpoint.x = Math.floor(xMin >= xMax ? (xMin + xMax) / 2 : clamp(midpoint.x, xMin, xMax));
        midpoint.y = Math.floor(yMin >= yMax ? (yMin + yMax) / 2 : clamp(midpoint.y, yMin, yMax));
    
        const wLeft = Math.floor(midpoint.x - this.x);
        const wRight = this.w - wLeft;
        const hTop = Math.floor(midpoint.y - this.y);
        const hBottom = this.h - hTop;
        this.children = [
            this.tree.pool.get(this.x, this.y, wLeft, hTop),
            this.tree.pool.get(midpoint.x, this.y, wRight, hTop),
            this.tree.pool.get(this.x, midpoint.y, wLeft, hBottom),
            this.tree.pool.get(midpoint.x, midpoint.y, wRight, hBottom),
        ];
        this.passEntitiesToChildren();
    };
    
    private passEntitiesToChildren(): void {
        for(let id of this.ids) {
            const rectangle = this.tree.rectangleById[id];
            for(let child of this.children)
                child.insert(id, rectangle);
        }
        this.ids.clear();
    };

    private childIdsTemp = new Set<number>();
    private getChildIds(): Set<number> | null {
        this.childIdsTemp.clear();
        for(let child of this.children) {
            if(child.hasChildren)
                return null;
            for(let id of child.ids)
                this.childIdsTemp.add(id);
        }
        return this.childIdsTemp;
    }

    remove(id: number): boolean {
        const rectangle = this.tree.rectangleById[id];
        if(this.hasChildren) {
            if(Geometry.CollideExplicit.RectangleRectangle(this.x, this.y, this.w, this.h, rectangle.x, rectangle.y, rectangle.w, rectangle.h)) {
                let shouldTryToMerge = false;
                for(let child of this.children)
                    if(child.remove(id))
                        shouldTryToMerge = true;
                
                if(shouldTryToMerge) {
                    const childIds = this.getChildIds();
                    if(childIds != null && childIds.size <= this.tree.maxEntitiesPerNode) {
                        for(let id of this.childIdsTemp)
                            this.ids.add(id);
                        this.children.clear();
                        return true;
                    }
                }
            }
        } else {
            this.ids.delete(id);
            return true;
        }
        return false;
    }
    
    insert(id: number, rectangle: IRectangle): void {
        if(!Geometry.CollideExplicit.RectangleRectangle(this.x, this.y, this.w, this.h, rectangle.x, rectangle.y, rectangle.w, rectangle.h))
            return;
    
        if(this.hasChildren)
            this.children.forEach(o => o.insert(id, rectangle));
        else {
            this.tree.rectangleById[id] = rectangle;
            this.ids.add(id);
            const canSplit = this.ids.size > this.tree.maxEntitiesPerNode
                && this.w / 2 >= this.tree.minNodeSideLength
                && this.h / 2 >= this.tree.minNodeSideLength;
            if(canSplit)
            {
                if(this.splitUsingMidpoint)
                    this.splitMidpoint();
                else
                    this.splitCenter();
            }
        }
    };
    
    queryPoint(x: number, y: number, ids: Set<number>): void {
        if(!Geometry.CollideExplicit.RectanglePoint(this.x, this.y, this.w, this.h, x, y))
            return;
    
        if(this.hasChildren)
            this.children.forEach(o => o.queryPoint(x, y, ids));
        else if(this.ids != null)
            this.ids.forEach(id => ids.add(id));
    };
    
    queryRectangle(x: number, y: number, w: number, h: number, ids: Set<number>): void {
        if(!Geometry.CollideExplicit.RectangleRectangle(this.x, this.y, this.w, this.h, x, y, w, h))
            return;
    
        if(this.hasChildren)
            this.children.forEach(o => o.queryRectangle(x, y, w, h, ids));
        else if(this.ids != null)
            this.ids.forEach(id => ids.add(id));
    };
}
  
  