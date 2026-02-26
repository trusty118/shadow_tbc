import { AuraId } from 'src/app/logs/models/aura-id.enum';

export class Settings {
  public hasteRating: number|null = null;
  public improvedMindBlast = 5;
  public auras: number[] = [];

  constructor(settings?: ISettings) {
    if (settings) {
      this.hasteRating = settings.hasteRating;
      this.improvedMindBlast = settings.improvedMindBlast;
      this.auras = settings.auras || [];
    }
  }

  equals(other: Settings) {
    return this.hasteRating === other.hasteRating &&
      this.improvedMindBlast === other.improvedMindBlast &&
      this.auras.length === other.auras.length &&
      this.auras.every((id) => other.auras.includes(id));
  }

  haveAura(id: AuraId) {
    return this.auras?.some((a) => a === id) || false;
  }
}

export interface ISettings {
  hasteRating: number|null;
  improvedMindBlast: number;
  auras?: number[];
}
