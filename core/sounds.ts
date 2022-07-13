interface Sound {
  soundName: string;
  familyName?: string;
  src: string;
  element: HTMLAudioElement;
  play: () => void;
  stop: () => void;
}

interface SoundFamily {
  soundNames: string[];
  sequentialIndex: number;
}

export class Sounds {
  private readonly soundByName: { [soundName: string]: Sound } = {};
  private readonly familyByFamilyName: { [familyName: string]: SoundFamily } = {};
  public muted: boolean = false;

  public toggleMuted() {
    this.muted = !this.muted;
    for (let soundName in this.soundByName) {
      const element = this.soundByName[soundName].element;
      element.muted = this.muted;
    }
  }

  constructor() {}

  public addMultiple(count: number, src: string, familyName: string) {
    for (let i = 0; i < count; i++) {
      const soundName = `${familyName}${i}`;
      this.add(soundName, src, familyName);
    }
  }

  public add(soundName: string, src: string, familyName?: string) {
    const element = document.createElement('audio');
    element.src = src;
    element.setAttribute('preload', 'auto');
    element.setAttribute('controls', 'none');
    element.style.display = 'none';
    document.body.appendChild(element);

    this.soundByName[soundName] = {
      soundName,
      src,
      element,
      play: () => element.play(),
      stop: () => element.pause(),
    };
    if (familyName) {
      if (!(familyName in this.familyByFamilyName))
        this.familyByFamilyName[familyName] = {
          soundNames: [],
          sequentialIndex: 0,
        };
      const family = this.familyByFamilyName[familyName];
      if (!family.soundNames.includes(soundName)) family.soundNames.push(soundName);
    }
  }

  public play(soundName: string, stopIfPlaying: boolean = true) {
    const sound = this.soundByName[soundName];
    if (!sound) console.error(`No sound known by the name (${soundName})`);
    if (stopIfPlaying) sound.stop();
    sound.play();
  }

  public stop(soundName: string) {
    const sound = this.soundByName[soundName];
    if (!sound) throw `No sound known by the name (${soundName})`;
    sound.stop();
  }

  public playFamily(familyName: string, stopIfPlaying: boolean = true) {
    const family = this.familyByFamilyName[familyName];
    if (!family) throw `No family known by the name (${familyName})`;
    if (family.soundNames.length <= 0) throw `No sounds in family (${familyName})`;
    const soundName = family.soundNames[family.sequentialIndex];
    this.play(soundName, stopIfPlaying);
    family.sequentialIndex = (family.sequentialIndex + 1) % family.soundNames.length;
  }
}
