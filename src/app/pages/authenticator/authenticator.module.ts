import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { IonicModule } from '@ionic/angular';
import { MatButtonModule } from '@angular/material/button';
import { AuthenticatorPageRoutingModule } from './authenticator-routing.module';

import { AuthenticatorPage } from './authenticator.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthenticatorPageRoutingModule,
    MatCardModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  declarations: [AuthenticatorPage]
})
export class AuthenticatorPageModule {}
