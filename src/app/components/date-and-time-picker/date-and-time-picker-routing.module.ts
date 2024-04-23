import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DateAndTimePickerPage } from './date-and-time-picker.page';

const routes: Routes = [
  {
    path: '',
    component: DateAndTimePickerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DateAndTimePickerPageRoutingModule {}
