import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GroupDetailPageRoutingModule } from './group-detail-routing.module';

import { GroupDetailPage } from './group-detail.page';

import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GroupDetailPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [GroupDetailPage]
})
export class GroupDetailPageModule {}
