import { Component, Input } from '@angular/core';
import { IStatField } from 'src/app/report/summary/fields/base.fields';
import { NgClass } from "@angular/common";

@Component({
  selector: 'summary',
  standalone: true,
  templateUrl: './summary.component.html',
  imports: [
    NgClass
  ],
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent {
  @Input() public fields!: IStatField[];
}
