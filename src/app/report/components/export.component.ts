import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuraId } from 'src/app/logs/models/aura-id.enum';
import { LogsService } from 'src/app/logs/logs.service';
import { ParamsService } from 'src/app/params.service';
import { PlayerAnalysis } from 'src/app/report/models/player-analysis';
import { SettingsService } from 'src/app/settings.service';
import { SpellId } from 'src/app/logs/models/spell-id.enum';
import { IDebuffData } from 'src/app/logs/interfaces';
import { CombatantFaction } from 'src/app/logs/models/combatant-info';

@Component({
  selector: 'export',
  standalone: true,
  imports: [
    NgClass,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ExportComponent implements OnInit {
  logId!: string;
  encounterId!: number;
  playerId!: string;
  analysis!: PlayerAnalysis;
  debuffs!: IDebuffData[];
  exportData: any;
  copied = false;

  @ViewChild('json')
  jsonInput!: ElementRef;

  constructor(private logs: LogsService,
              private router: Router,
              private route: ActivatedRoute,
              private params: ParamsService,
              private settingsSvc: SettingsService) {
  }

  ngOnInit() {
    this.route.paramMap.pipe(
      withLatestFrom(this.route.parent!.paramMap),
      switchMap(([params, parentParams]) => {
        this.logId = parentParams.get('logId') as string;
        this.playerId = params.get('player') as string;
        this.encounterId = parseInt(params.get('encounterId') as string, 10);

        const analysis = PlayerAnalysis.getCached(this.logId, this.encounterId, this.playerId);

        if (analysis) {
          return of(analysis);
        } else {
          return this.logs.createAnalysis(this.logId, this.playerId, this.encounterId);
        }
      }),
      switchMap((analysis: PlayerAnalysis) => {
        this.analysis = analysis;

        return this.logs.getEnemyDebuffs(analysis.log, this.encounterId);
      })
    ).subscribe((debuffs: IDebuffData[]) => {
      this.debuffs = debuffs;
      this.createExportData();
    });
  }

  createExportData() {
    const settings = this.settingsSvc.get(this.playerId);
    const items = this.playerItems();
    const professions = this.findPlayerProfessions(items);

    const data = {
      settings: {
        iterations: 5000,
        showDamageMetrics: true,
        faction: this.analysis.actorInfo.faction
      },
      raidBuffs: {
        powerWordFortitude: 'TristateEffectImproved',
        divineSpirit: true,
        giftOfTheWild: this.auraState(AuraId.GIFT_OF_THE_WILD, 'TristateEffectImproved'),
        arcaneBrilliance: this.haveClass('Mage'), // not sure why this isn't in combatant info auras?
        leaderOfThePack: this.auraState(AuraId.LEADER_OF_THE_PACK, 'TristateEffectImproved'),
        totemOfWrath: this.haveClass('Shaman-Elemental'),
        moonkinAura: this.auraState(
          AuraId.MOONKIN_AURA,
          settings.improvedMoonkinAura ? 'TristateEffectImproved' : 'TristateEffectRegular'
        ),
        wrathOfAirTotem: this.analysis.applyWrathOfAir,
        manaSpringTotem: 'TristateEffectImproved',
        bloodlust: this.haveBuff(AuraId.BLOODLUST) || this.haveBuff(AuraId.HEROISM)
      },
      debuffs: {
        misery: true,
        judgementOfWisdom: this.haveDebuff(AuraId.JUDGEMENT_OF_WISDOM),
        shadowMastery: this.haveDebuff(AuraId.SHADOW_MASTERY)
      },
      partyBuffs: {
        heroicPresence: this.auraState(AuraId.HEROIC_PRESENCE)
      },
      player: {
        name: 'Player',
        race: `Race${this.playerRace}`,
        class: 'ClassPriest',
        equipment: { items },
        consumes: {
          flask: 'FlaskOfPureDeath',
          food: 'BlackenedBasilisk',
          defaultPotion: this.combatPotion,
          prepopPotion: this.preCombatPotion
        },
        buffs: {
          blessingOfKings: this.auraState(AuraId.BLESSING_OF_KINGS),
          blessingOfWisdom: 'TristateEffectImproved',
          powerInfusions: this.countPowerInfusions(),
          vampiricTouch: true
        },
        talentsString: '05032031--325023051223010323151301351',
        profession1: professions[0],
        profession2: professions.length > 1 ? professions[1] : undefined,
        cooldowns: this.cooldowns(),
        healingModel: {},
        shadowPriest: {
          rotation: {
            rotationType: 'Ideal',
            latency: Math.round((this.analysis.report.getSpellStats(SpellId.MIND_FLAY)?.avgNextCastLatency || 0.2) * 1000)
          },
          talents: {},
          options: {
            useShadowfiend: true,
            armor: 'InnerFire',
            useMindBlast: true,
            useShadowWordDeath: true
          }
        }
      },
      encounter: {
        duration: this.analysis.encounter.durationSeconds,
        durationVariation: Math.round(this.analysis.encounter.durationSeconds / 10)
      },
    };

    this.exportData = this.compact(data);
  }

  get playerRace() {
    // Pretend all the alliance are humans, whatever
    if (this.analysis.actorInfo.faction === CombatantFaction.ALLIANCE) {
      return 'Human';
    }

    // Detect troll from 'zerkin
    if (this.haveBuff(AuraId.BERSERKING)) {
      return 'Troll';
    }

    return 'Undead';
  }

  get preCombatPotion() {
    if (this.auraState(AuraId.DESTRUCTION)) {
      return 'DestructionPotion';
    }

    return undefined;
  }

  get combatPotion() {
    const destruction = this.analysis.events.buffs.find((b) =>
      b.ability.guid === AuraId.DESTRUCTION && b.type === 'applybuff' && b.timestamp > this.analysis.encounter.start);
    if (destruction) {
      return 'DestructionPotion';
    }

    return undefined;
  }

  playerItems(): ISimItem[] {
    return this.analysis.actorInfo.gear
      .filter((item) => item.id > 0)
      .map((item) => ({
        id: item.id,
        enchant: item.permanentEnchant,
        gems: item.gems?.map((g) => g.id) || undefined
      }));
  }

  findPlayerProfessions(items: ISimItem[]) {
    let professions: string[] = [];

    // JC - gems
    const jcGems = [
      33133, // Don Julio's Heart
    ];
    const foundJc = items.some((item) => {
      if (!item.gems) {
        return false;
      }

      return item.gems.some((g) => jcGems.includes(g));
    });
    if (foundJc) {
      professions.push('Jewelcrafting');
    }

    return professions;
  }

  countPowerInfusions() {
    const count = this.analysis.events.buffs
      .filter((b) => b.ability.guid === AuraId.POWER_INFUSION && b.type === 'applybuff')
      .length;

    return (count > 0) ? count : undefined;
  }

  cooldowns() {
    const cooldowns: { id: { spellId: number, tag?: number }, timings: number[]}[] = [];

    const lustId = this.analysis.actorInfo.faction == CombatantFaction.ALLIANCE ? AuraId.HEROISM : AuraId.BLOODLUST;
    const lust = this.analysis.events.buffs.find((b) => b.ability.guid === lustId);
    if (lust) {
      cooldowns.push({
        id: { spellId: AuraId.BLOODLUST, tag: -1 },
        timings: [Math.round((lust.timestamp - this.analysis.encounter.start)/1000)]
      });
    }

    const fiend = this.analysis.report.casts.find((c) => c.spellId === SpellId.SHADOW_FIEND);
    if (fiend) {
      cooldowns.push({
        id: { spellId: SpellId.SHADOW_FIEND },
        timings: [Math.round((fiend.castStart - this.analysis.encounter.start)/1000)]
      });
    }

    const infusions = this.analysis.events.buffs
      .filter((b) => b.ability.guid === AuraId.POWER_INFUSION && b.type === 'applybuff');

    if (infusions.length > 0) {
      cooldowns.push({
        id: { spellId: AuraId.POWER_INFUSION, tag: -1},
        timings: infusions.map((b) => Math.round((b.timestamp - this.analysis.encounter.start)/1000))
      });
    }

    if (cooldowns.length > 0) {
      return { cooldowns };
    }
    return {};
  }

  haveBuff(id: AuraId, event?: string) {
    return this.analysis.events.buffs.some((b) =>
      b.ability.guid === id && (event === undefined || b.type === event));
  }

  haveDebuff(id: AuraId) {
    return this.debuffs.some((b) => b.ability.guid === id);
  }

  haveClass(type: string) {
    return this.analysis.log.actors.some((a) => {
      return (a.type === type || a.icon === type) && a.encounterIds.includes(this.encounterId)
    });
  }

  auraState(id: AuraId, whenTrue: any = true) {
    // just omit values where true uses a tristate toggle but the value is false
    const whenFalse = whenTrue === true ? false : undefined;
    return this.analysis.actorInfo.haveAura(id) ? whenTrue : whenFalse;
  }

  compact(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => typeof v === "object" ? this.compact(v) : v);
    } else {
      return Object.fromEntries(
        Object
          .entries(obj)
          .filter(([_, v]) => v != null)
          .map(([k, v]) => [k, typeof v === "object" ? this.compact(v) : v])
      );
    }
  }

  get exportJson() {
    return JSON.stringify(this.exportData, undefined, 2);
  }

  copy(event: Event) {
    event.preventDefault();

    if (this.jsonInput) {
      this.jsonInput.nativeElement.select();
      navigator.clipboard.writeText(this.jsonInput.nativeElement.value);
      this.copied = true;
    }
  }

  close(event: Event) {
    event.preventDefault();
    this.router.navigate(['/report', this.logId, this.playerId, this.encounterId], {
      queryParams: this.params.forNavigation()
    });
  }
}

interface ISimItem {
  id: number;
  permanentEnchant?: number;
  gems?: number[];
}
