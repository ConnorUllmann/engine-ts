interface Sound {
    name: string,
    src: string,
    element: HTMLAudioElement,
    play: () => void,
    stop: () => void
}

export class Sounds {
    private soundsByName: { [name: string]: Sound } = {};

    constructor() { }

    public add(name: string, src: string) {
        const element = document.createElement("audio");
        element.src = src;
        element.setAttribute('preload', 'auto');
        element.setAttribute('controls', 'none');
        element.style.display = 'none';
        document.body.appendChild(element);

        this.soundsByName[name] = { 
            name,
            src,
            element,
            play: () => element.play(),
            stop: () => element.pause()
        };
    }

    public play(name: string, stopIfPlaying:boolean=true) {
        const sound = this.soundsByName[name];
        if(!sound)
            throw `No sound known by the name (${name})`;
        if(stopIfPlaying)
            sound.stop();
        sound.play();
    }

    public stop(name: string) {
        const sound = this.soundsByName[name];
        if(!sound)
            throw `No sound known by the name (${name})`;
        sound.stop();
    }
}