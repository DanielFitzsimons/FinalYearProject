import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MediaFilesPageRoutingModule } from './media-files-routing.module';

import { MediaFilesPage } from './media-files.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MediaFilesPageRoutingModule
  ],
  declarations: [MediaFilesPage]
})
export class MediaFilesPageModule {}
