import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DateAndTimePickerPageRoutingModule } from './date-and-time-picker-routing.module';

import { DateAndTimePickerPage } from './date-and-time-picker.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DateAndTimePickerPageRoutingModule
  ],
  declarations: [DateAndTimePickerPage]
})
export class DateAndTimePickerPageModule {}
