import { clamp } from './utils';

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
  private readonly soundNamesByVolumeGroup: { [volumeGroup: string]: string[] } = {};
  private readonly volumeGroupsBySoundName: { [soundName: string]: string[] } = {};
  private readonly volumeNormalByVolumeGroup: { [volumeGroup: string]: number } = {};
  public muted: boolean = false;

  public toggleMuted() {
    this.muted = !this.muted;
    for (let soundName in this.soundByName) {
      const element = this.soundByName[soundName].element;
      element.muted = this.muted;
    }
  }

  public setVolumeForGroup(volumeGroup: string, volumeNormal: number) {
    volumeNormal = clamp(volumeNormal, 0, 1);

    const volumeNormalPrevious = this.volumeNormalByVolumeGroup[volumeGroup];
    if (volumeNormalPrevious === volumeNormal) return;

    this.volumeNormalByVolumeGroup[volumeGroup] = volumeNormal;

    const soundNames = this.soundNamesByVolumeGroup[volumeGroup];
    if (!soundNames) return;

    for (const soundName of soundNames) {
      const sound = this.soundByName[soundName];
      if (!sound) continue;

      sound.element.volume = this.getVolumeForSoundName(soundName);
    }
  }

  public getVolumeForGroup(volumeGroup: string): number {
    return this.volumeNormalByVolumeGroup[volumeGroup] ?? 1;
  }

  public get isVolumeInResetState() {
    return !Object.values(this.volumeNormalByVolumeGroup).some(volumeNormal => volumeNormal < 1);
  }

  public resetVolume() {
    if (this.isVolumeInResetState) return;

    for (const [volumeGroup, volumeNormal] of Object.entries(this.volumeNormalByVolumeGroup)) {
      if (volumeNormal < 1) this.setVolumeForGroup(volumeGroup, 1);
    }
  }

  constructor() {}

  public addMultiple(count: number, src: string, familyName: string, volumeGroups?: string[]) {
    for (let i = 0; i < count; i++) {
      const soundName = `${familyName}${i}`;
      this.add(soundName, src, familyName, volumeGroups);
    }
  }

  public add(soundName: string, src: string, familyName?: string, volumeGroups?: string[]) {
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

    if (volumeGroups) {
      for (const volumeGroup of volumeGroups) {
        (this.soundNamesByVolumeGroup[volumeGroup] ??= []).push(soundName);
        (this.volumeGroupsBySoundName[soundName] ??= []).push(volumeGroup);
      }

      element.volume = this.getVolumeForSoundName(soundName);
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

  private getVolumeForSoundName(soundName: string) {
    const volumeGroups = this.volumeGroupsBySoundName[soundName];
    let volume = 1;
    for (const volumeGroup of volumeGroups) {
      const volumeNormal = this.volumeNormalByVolumeGroup[volumeGroup];
      if (volumeNormal == null) continue;
      volume *= volumeNormal;
    }
    return volume;
  }
}
