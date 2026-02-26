import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { HasteUtils } from 'src/app/report/models/haste';
import { ISettings } from 'src/app/settings';
import { PlayerAnalysis } from 'src/app/report/models/player-analysis';

export enum DamageType {
  NONE,
  DIRECT,
  DOT,
  CHANNEL,
  AOE
}

export const SPELL_DEFAULTS: Partial<ISpellData> = {
  rankIds: [],
  damageIds: [],
  baseCastTime: 0,
  maxDamageInstances: 0,
  maxDuration: 0,
  maxTicks: 0,
  baseTickTime: 0,
  cooldown: 0,
  cancrit: true,
  gcd: true,
  dotHaste: false,
  statsByTick: false,
  multiTarget: false,
};

function data(params: Partial<ISpellData> = {}): ISpellData {
  return Object.assign({}, SPELL_DEFAULTS, params) as ISpellData;
}

export class Spell {
  public static baseData(id: SpellId) {
    return Spell.dataBySpellId[id];
  }

  public static get(id: SpellId, analysis: PlayerAnalysis, currentHaste?: number): ISpellData {
    let baseData = Spell.dataBySpellId[id];

    // apply overrides for dynamic data
    const dynamic = baseData.dynamic ? baseData.dynamic.call(null, baseData, analysis.settings) : {};
    let data = Object.assign({}, Spell.dataBySpellId[id], dynamic);

    // apply gear bonuses from combatant info
    if (analysis.actorInfo?.bonuses?.hasOwnProperty(baseData.mainId)) {
      data = Object.assign(data, analysis.actorInfo!.bonuses[baseData.mainId]);
    }

    // apply haste adjustments if haste specified.
    if (currentHaste !== undefined && data.damageType === DamageType.DOT && data.dotHaste) {
      data.maxDuration = HasteUtils.duration(data, currentHaste);
    }

    return data;
  }

  public static rank(id: SpellId, data: ISpellData) {
    if (id === data.mainId) {
      return data.maxRank;
    }

    return data.rankIds[id];
  }

  public static fromDamageId(id: number): ISpellData|undefined {
    if (this.dataBySpellId.hasOwnProperty(id)) {
      return this.dataBySpellId[id];
    }

    return Object.values(this.data).find((spell) => spell.damageIds.includes(id));
  }

  public static data: {[spellId: number]: ISpellData} = {
    [SpellId.ADAMANTITE_GRENDADE]: data({
      damageType: DamageType.AOE,
      baseCastTime: 1,
      maxDamageInstances: 20,
      gcd: false
    }),

    [SpellId.BERSERKING]: data({
      damageType: DamageType.NONE,
      gcd: false
    }),

    [SpellId.DEATH]: data({
      rankIds: {
        [32379]: 1
      },
      maxRank: 2,
      damageType: DamageType.DIRECT,
      maxDamageInstances: 1,
      cooldown: 12
    }),

    [SpellId.DENSE_DYNAMITE]: data({
      damageType: DamageType.AOE,
      baseCastTime: 1,
      maxDamageInstances: 20,
      gcd: false
    }),

    [SpellId.STARSHARDS]: data({
      rankIds: {
        [19305]: 7
      },
      maxRank: 8,
      damageType: DamageType.DOT,
      dotHaste: false,
      maxDamageInstances: 5,
      maxDuration: 15,
      maxTicks: 5,
      baseTickTime: 3,
    }),

    [SpellId.DEVOURING_PLAGUE]: data({
      rankIds: {
        [19280]: 6
      },
      maxRank: 7,
      damageType: DamageType.DOT,
      dotHaste: false,
      maxDamageInstances: 8,
      maxDuration: 24,
      maxTicks: 8,
      baseTickTime: 3,
    }),

    [SpellId.DISPEL_MAGIC]: data({
      damageType: DamageType.NONE
    }),

    [SpellId.FADE]: data({
      damageType: DamageType.NONE,
      maxDuration: 10,
      cooldown: 30
    }),

    [SpellId.FEAR_WARD]: data({
      damageType: DamageType.NONE,
      maxDuration: 180,
      cooldown: 180
    }),

    [SpellId.FEL_IRON_BOMB]: data({
      damageType: DamageType.AOE,
      baseCastTime: 1,
      maxDamageInstances: 20,
      gcd: false
    }),

    [SpellId.GOBLIN_SAPPER]: data({
      damageType: DamageType.AOE,
      maxDamageInstances: 20,
      gcd: false
    }),

    [SpellId.HOLY_NOVA]: data({
      damageType: DamageType.AOE,
      rankIds: {
        [27801]: 6
      },
      maxRank: 7,
      maxDamageInstances: 20,
      gcd: true,
    }),

    [SpellId.MASS_DISPEL]: data({
      damageType: DamageType.NONE
    }),

    [SpellId.MELEE]: data({
      damageType: DamageType.DIRECT,
      gcd: false
    }),

    [SpellId.MIND_BLAST]: data({
      rankIds: {
        [25372]: 10
      },
      maxRank: 11,
      damageType: DamageType.DIRECT,
      baseCastTime: 1.5,
      maxDamageInstances: 1,
      cooldown: 8,
      dynamic: (baseData, settings) => ({
        cooldown: baseData.cooldown - (0.5 * settings.improvedMindBlast)
      })
    }),

    [SpellId.MIND_FLAY]: data({
      rankIds: {
        [17314]: 5,
        [18807]: 6
      },
      maxRank: 7,
      cancrit: false,
      damageIds: [SpellId.MIND_FLAY_TICK],
      damageType: DamageType.CHANNEL,
      maxDamageInstances: 3,
      maxDuration: 3,
      maxTicks: 3,
      baseTickTime: 1,
      statsByTick: true
    }),

    [SpellId.PAIN]: data({
      rankIds: {
        [10894]: 8,
        [25367]: 9
      },
      maxRank: 10,
      cancrit: false,
      damageType: DamageType.DOT,
      baseTickTime: 3,
      dotHaste: false
    }),

    [SpellId.SHADOW_FIEND]: data({
      damageType: DamageType.DIRECT,
      maxDuration: 15,
      cooldown: 180
    }),

    [SpellId.SHIELD]: data({
      rankIds: {
        [10900]: 9,
        [10901]: 10,
        [25217]: 11
      },
      maxRank: 12,
      damageType: DamageType.NONE,
      maxDuration: 30,
      cooldown: 4
    }),

    [SpellId.SUPER_SAPPER]: data({
      damageType: DamageType.AOE,
      maxDamageInstances: 20,
      gcd: false
    }),

    [SpellId.VAMPIRIC_EMBRACE]: data({
      damageType: DamageType.NONE
    }),

    [SpellId.VAMPIRIC_TOUCH]: data({
      rankIds: {
        [34914]: 1,
        [34916]: 2
      },
      maxRank: 3,
      cancrit: false,
      damageType: DamageType.DOT,
      dotHaste: false,
      baseCastTime: 1.5,
      maxDamageInstances: 5,
      maxDuration: 15,
      maxTicks: 5,
      baseTickTime: 3
    })
  }

  public static dataBySpellId: {[spellId: number]: ISpellData} =
    Object.keys(Spell.data).reduce((lookup, next) => {
      const spellId = parseInt(next),
        data: ISpellData = Spell.data[spellId];

      data.mainId = spellId;
      lookup[spellId] = data;

      for (let rankId of Object.keys(data.rankIds)) {
        lookup[parseInt(rankId)] = data;
      }

      return lookup;
    }, {} as {[spellId: number]: ISpellData});
}

export interface ISpellData {
  mainId: number;
  damageType: DamageType;
  rankIds: {[id: number]: number };
  maxRank: number|undefined;
  damageIds: number[]
  baseCastTime: number;
  maxDamageInstances: number;
  maxDuration: number;
  baseTickTime: number;
  cancrit: boolean;
  maxTicks: number;
  cooldown: number;
  gcd: boolean;
  dotHaste: boolean;
  statsByTick: boolean;
  multiTarget: boolean;
  maxInstancesPerDamageId?: {[id: number]: number};
  dynamic?: (baseData: ISpellData, settings: ISettings) => Partial<ISpellData>
}
