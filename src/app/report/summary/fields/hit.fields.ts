import { BaseFields } from 'src/app/report/summary/fields/base.fields';
import { format } from 'src/app/report/models/stat-utils';
import { CastStats } from 'src/app/report/models/cast-stats';

export class HitFields extends BaseFields {
  fields(stats: CastStats) {
  const spellData = this.spellData(stats); // Get the spell data (contains canCrit)
    
    const fields = [
      this.field({ label: 'Hits', value: stats.totalHits }),
      this.field({ label: 'Avg Hit', value: format(stats.avgHit) })
    ];

    // Only add Crit Rate if the spell is actually capable of critting
    if (spellData && spellData.cancrit) {
      fields.push(this.field({ 
        label: 'Crit Rate', 
        value: `${format(stats.critRate * 100, 1, '%')}` 
      }));
    }

    fields.push(this.field({ label: 'Damage/GCD', value: format(stats.damagePerGcd, 0) }));
    fields.push(this.break());

    return fields;
  }
}
