import { IRectangle, IPoint } from '@engine-ts/geometry/interfaces';
import { Geometry } from '@engine-ts/geometry/geometry';
import { Point } from '@engine-ts/geometry/point';
import { random, tau } from '@engine-ts/core/utils';
import { Entity } from '@engine-ts/core/entity';

export class Swarm {
    // TODO: make this a dictionary keyed by entityId instead of just a list
    private readonly swarmInstincts: SwarmInstinct[] = [];
    private readonly predators: Entity[] = [];

    public addPredator(predator: Entity) { this.predators.push(predator); }
    public removePredator(predator: Entity) { this.predators.remove(predator); }
    public addSwarmer(swarmer: Entity) { this.swarmInstincts.push(new SwarmInstinct(swarmer)); }
    public removeSwarmer(swarmer: Entity) { this.swarmInstincts.remove(this.swarmInstincts.first(o => o.swarmer === swarmer)); }

    public update() {
        for(const swarmInstinct of this.swarmInstincts)
            swarmInstinct.updateAngle(this.swarmInstincts, this.predators);
    }

    public getAngle(swarmer: Entity): number {
        return this.swarmInstincts.first(o => o.swarmer === swarmer).angle;
    }

    public isAvoidingPredator(swarmer: Entity): boolean {
        return this.swarmInstincts.first(o => o.swarmer === swarmer).isAvoidingPredator;
    }

    public isRepulsed(swarmer: Entity): boolean {
        return this.swarmInstincts.first(o => o.swarmer === swarmer).isRepulsed;
    }
}

class SwarmInstinct {
    public angle: number = random() * tau;

    public isRepulsed: boolean = false;
    public isAvoidingPredator: boolean = false;

    // must be <= alignmentRadius
    public repulsionRadius: number = 10;
    // must be <= attractionRadius
    public alignmentRadius: number = 30;
    public attractionRadius: number = 100;
    public predatorAvoidanceRadius: number = 150;

    public repulsionMultiplier: number = 50; 
    public alignmentMultiplier: number = 1;
    public attractionMultiplier: number = 1;

    public get visibleRectangle(): IRectangle {
        return {
            x: this.swarmer.position.x - this.attractionRadius,
            y: this.swarmer.position.y - this.attractionRadius,
            w: 2 * this.attractionRadius,
            h: 2 * this.attractionRadius
        };
    }

    constructor(public readonly swarmer: Entity) {}

    public updateAngle(swarmInstincts: SwarmInstinct[], predators: Entity[]) {
        const predatorAvoidanceRadiusSq = this.predatorAvoidanceRadius * this.predatorAvoidanceRadius;
        const visiblePredators = predators.filter(o => Geometry.Point.DistanceSq(o.position, this.swarmer.position) <= predatorAvoidanceRadiusSq);
        const predatorDirection: Point = Point.Create(Geometry.Points.Sum(visiblePredators
            .map(o => Geometry.Point.Normalized(Geometry.Point.Subtract(this.swarmer.position, o.position), this.repulsionMultiplier))));
        if(predatorDirection.lengthSq > 0.01) {
            this.isAvoidingPredator = true;
            this.angle = predatorDirection.angle;
        }
        else
        {
            this.isAvoidingPredator = false;
    
            // reset to start as isRepulsed will update inside swarmVectorForNeighbor
            this.isRepulsed = false;
            this.angle = Geometry.Point.Angle(Geometry.Points.Sum(swarmInstincts
                .map(swarmInstinct => this.swarmVectorForNeighbor(swarmInstinct))));
        }
    }

    public swarmVectorForNeighbor(neighborSwarmInstinct: SwarmInstinct): IPoint {
        if (this.swarmer === neighborSwarmInstinct.swarmer)
            return { x: 0, y: 0 };
        const position = this.swarmer.position.clone;
        const neighborPosition = neighborSwarmInstinct.swarmer.position.clone;
        const distanceSquared = Geometry.Point.DistanceSq(neighborPosition, position);
        const isRepulsed = distanceSquared <= this.repulsionRadius * this.repulsionRadius;
        if(isRepulsed)
            this.isRepulsed = true;
        return distanceSquared < 0.001
            ? Point.Vector(this.repulsionMultiplier, random() * tau)
            : isRepulsed
                ? position.subtract(neighborPosition).normalize(this.repulsionMultiplier)
                : distanceSquared <= this.alignmentRadius * this.alignmentRadius
                    ? Point.Vector(this.alignmentMultiplier, neighborSwarmInstinct.angle)
                    : distanceSquared <= this.attractionRadius * this.attractionRadius
                        ? neighborPosition.subtract(position).normalize(this.attractionMultiplier)
                        : { x: 0, y: 0 };
    };
}