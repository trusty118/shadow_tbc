import { AuraId } from 'src/app/logs/models/aura-id.enum';
import { IBuffData, IEventData } from 'src/app/logs/interfaces';
import { Settings } from 'src/app/settings';
import { PlayerAnalysis } from 'src/app/report/models/player-analysis';

export enum BuffTrigger {
  CAST_END,
  ON_USE,
  EXTERNAL
}

export const BUFF_DEFAULTS: Partial<IBuffDetails> = {
  haste: 0,
  hasteRating: 0,
  stack: 0,
  maxStack: 0,
  trigger: BuffTrigger.EXTERNAL,
  doesNotStackWith: [],
  summaryIcon: false,
  detailsIcon: true,
  debuff: false,
  infer: false
};

function buff(params: Partial<IBuffDetails> = {}) {
  return Object.assign({}, BUFF_DEFAULTS, params) as IBuffDetails;
}

export class Buff {
  public static get(data: IEventData, settings: Settings): IBuffDetails {
    const baseData = Buff.data[data.ability.guid];
    const dynamic = baseData.dynamic ? baseData.dynamic.call(null, baseData, data, settings) : {};

    return Object.assign({}, baseData, dynamic, {
      id: data.ability.guid,
      name: data.ability.name,
      stack: data.stack || (baseData.maxStack > 0 ? 1 : 0)
    });
  }

  public static isDebuff(id: AuraId) {
    return Buff.data[id]?.debuff;
  }

  public static inferrable(analysis: PlayerAnalysis) {
    return Object.keys(Buff.data)
      .map((k) => parseInt(k))
      .filter((auraId) => {
        const data = Buff.data[auraId];
        if (typeof data.infer === "boolean") {
          return data.infer;
        } else {
          return data.infer.call(null, analysis);
        }
      })
      .map((auraId) => {
        const data = Buff.data[auraId];
        return Object.assign({ id: auraId }, data);
      })
      .sort((a, b) => b.haste - a.haste);
  }

  public static data: IBuffLookup = {

    [AuraId.BERSERKING]: buff({
      haste: 0.2,
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.BLOODLUST]: buff({
      haste: 0.3,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.POWER_INFUSION],
      summaryIcon: true
    }),

    [AuraId.DRUMS_OF_BATTLE]: buff({
      hasteRating: 80,
      trigger: BuffTrigger.EXTERNAL,
      summaryIcon: true
    }),

    [AuraId.GREATER_DRUMS_OF_BATTLE]: buff({
      hasteRating: 80,
      trigger: BuffTrigger.EXTERNAL,
      summaryIcon: true
    }),

    [AuraId.HASTE]: buff({
      hasteRating: 400,
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.HEROISM]: buff({
      haste: 0.3,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.POWER_INFUSION],
      summaryIcon: true
    }),

    [AuraId.INNER_FOCUS]: buff({
      trigger: BuffTrigger.ON_USE,
      summaryIcon: true
    }),

    [AuraId.MOONKIN_AURA]: buff({
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.RETRIBUTION_AURA],
      dynamic: (baseData, event, settings) => ({
        haste: settings.improvedMoonkinAura ? 0.03 : 0
      })
    }),

    [AuraId.POWER_INFUSION]: buff({
      haste: 0.2,
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.HEROISM, AuraId.BLOODLUST],
      summaryIcon: true
    }),

    [AuraId.RETRIBUTION_AURA]: buff({
      trigger: BuffTrigger.EXTERNAL,
      doesNotStackWith: [AuraId.MOONKIN_AURA],
      dynamic: (baseData, event, settings) => ({
        haste: settings.improvedRetAura ? 0.03 : 0
      })
    }),

    [AuraId.WRATH_OF_AIR]: buff({
      haste: 0.05,
      trigger: BuffTrigger.EXTERNAL,
      infer: (analysis) => analysis.applyWrathOfAir,
      name: 'Wrath of Air', // name used when inferring
      inferenceThresholds: {
        add: .035,
        remove: .025
      }
    })
  }
}

interface IBuffLookup {
  [id: number]: IBuffDetails
}

export interface IBuffDetails {
  id: AuraId;
  name: string;
  debuff: boolean;
  haste: number;
  hasteRating: number;
  trigger: BuffTrigger;
  doesNotStackWith: AuraId[];
  summaryIcon: boolean;
  detailsIcon: boolean;
  stack: number;
  maxStack: number;
  infer: boolean | ((analysis: PlayerAnalysis) => boolean);
  inferenceThresholds?: { add: number, remove: number };
  dynamic?: (baseData: IBuffDetails, event: IEventData, settings: Settings) => Partial<IBuffDetails>
}

export interface IBuffEvent {
  id: AuraId,
  data: IBuffDetails,
  event: IBuffData
}
