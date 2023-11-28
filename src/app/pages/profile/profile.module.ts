import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { IonicModule } from '@ionic/angular';
import { FirebaseAppModule } from '@angular/fire/app';
import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilePageRoutingModule,
    MatButtonModule,
    FirebaseAppModule, 
    ReactiveFormsModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}
