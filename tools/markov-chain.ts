import { RNG } from '@engine-ts/core/rng';
import { rng } from '@engine-ts/core/utils';

export class MarkovChain {
    private current: MarkovLink | null;

    constructor(current: MarkovLink, private readonly rng?: RNG) {
        this.current = current;
    }

    public update() {
        if(this.current == null)
            return;
        this.current = this.current.sample(this.rng);
        if(this.current != null)
            this.current.execute();
    }
}

export class MarkovLink {
    private readonly linkWeights: { link: MarkovLink, weight: number }[] = [];

    constructor(private readonly action?: () => void) {}

    public addLink(link: MarkovLink, weight: number) {
        this.linkWeights.push({ link, weight });
    }

    public execute(): void {
        if(this.action)
            this.action();
    }

    public sample(_rng?: RNG): MarkovLink | null {
        if(this.linkWeights.length <= 0)
            return null;
        
        const max = this.linkWeights.map(o => o.weight).sum() ?? 0;
        const selection = (_rng ?? rng).random() * max;
        let partialSum = 0;
        for(const { link, weight } of this.linkWeights) {
            if(partialSum + weight >= selection)
                return link;
            partialSum += weight;
        }
        throw new Error(`Failed to sample for the next markov link. partialSum: ${partialSum}, selection: ${selection}, max: ${max}, linkWeights: ${JSON.stringify(this.linkWeights)}`);
    }
}