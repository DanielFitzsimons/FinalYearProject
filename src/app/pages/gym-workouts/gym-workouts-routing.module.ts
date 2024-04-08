import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GymWorkoutsPage } from './gym-workouts.page';

const routes: Routes = [
  {
    path: '',
    component: GymWorkoutsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GymWorkoutsPageRoutingModule {}
