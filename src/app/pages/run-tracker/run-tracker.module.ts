import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';

import { RunTrackerPageRoutingModule } from './run-tracker-routing.module';

import { RunTrackerPage } from './run-tracker.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RunTrackerPageRoutingModule,
    HttpClientModule,
  ],
  declarations: [RunTrackerPage]
})
export class RunTrackerPageModule {}
