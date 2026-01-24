import { Routes } from "@angular/router";
import {HomeComponent} from "./home.component";
import {ReportWrapperComponent} from "./report/report-wrapper.component";
import {ReportDetailsComponent} from "./report/components/report-details.component";
import {SettingsComponent} from "./report/components/settings.component";
import {ExportComponent} from "./report/components/export.component";

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'report/:logId',
    component: ReportWrapperComponent,
    children: [
      {
        path: ':player',
        component: ReportDetailsComponent
      },
      {
        path: ':player/:encounterId',
        component: ReportDetailsComponent
      },
      {
        path: ':player/:encounterId/settings',
        component: SettingsComponent
      },
      {
        path: ':player/:encounterId/export',
        component: ExportComponent
      }
    ]
  }
];
