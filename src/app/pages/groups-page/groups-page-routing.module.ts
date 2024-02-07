import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GroupsPagePage } from './groups-page.page';

const routes: Routes = [
  {
    path: '',
    component: GroupsPagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GroupsPagePageRoutingModule {}
