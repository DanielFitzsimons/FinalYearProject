import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagingInterfaceComponent } from 'src/app/components/messaging-interface/messaging-interface.component';

import { IonicModule } from '@ionic/angular';

import { MessagingPageRoutingModule } from './messaging-routing.module';

import { MessagingPage } from './messaging.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MessagingPageRoutingModule
  ],
  declarations: [MessagingPage, MessagingInterfaceComponent]
})
export class MessagingPageModule {}
