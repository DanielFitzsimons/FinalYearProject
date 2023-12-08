import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { MatDialogModule } from '@angular/material/dialog';
import { HomePageRoutingModule } from './home-routing.module';
import { FeedComponent } from 'src/app/components/feed/feed.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    MatDialogModule,
    
  ],
  declarations: [HomePage, FeedComponent,]
})
export class HomePageModule {}
