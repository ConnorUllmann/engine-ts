import { Geometry } from '@engine-ts/geometry/geometry';
import { IPoint } from '@engine-ts/geometry/interfaces';

export class Bone {
    constructor(
        public readonly parent: Bone | null,
        public length: number,
        public angleLocal: number
    ) {}

    public get vector(): IPoint { return Geometry.Point.Vector(this.length, this.angle); }

    public get start(): IPoint { return this.parent?.end || Geometry.Point.Zero; }
    public get end(): IPoint { return Geometry.Point.Add(this.start, this.vector); }
    public set end(position: IPoint) {
        const positionDiff = Geometry.Point.Subtract(position, this.start);
        this.length = Geometry.Point.Length(positionDiff);
        this.angle = Geometry.Point.Angle(positionDiff);
    }

    public get parentAngle(): number { return this.parent?.angle || 0; }
    public get angle(): number { return this.angleLocal + this.parentAngle; }
    public set angle(angle: number) { this.angleLocal = angle - this.parentAngle; }
}

export class Skeleton extends Bone {
    constructor(private readonly parentEntity: { position: IPoint } | null=null, public offset: IPoint=Geometry.Point.Zero, angleLocal: number=0) {
        super(null, 0, angleLocal);
    }

    public get start(): IPoint { return Geometry.Point.Add(this.offset, this.parentEntity?.position || Geometry.Point.Zero); }
    public get parentAngle(): number { return 0; }
}
