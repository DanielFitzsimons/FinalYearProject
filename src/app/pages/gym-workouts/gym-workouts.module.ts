import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GymWorkoutsPageRoutingModule } from './gym-workouts-routing.module';

import { GymWorkoutsPage } from './gym-workouts.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GymWorkoutsPageRoutingModule
  ],
  declarations: [GymWorkoutsPage]
})
export class GymWorkoutsPageModule {}
