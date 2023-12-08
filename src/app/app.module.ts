import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { UserProfileService } from './services/user-profile.service';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from 'src/environments/environment';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { FirebaseTSApp } from 'firebasets/firebasetsApp/firebaseTSApp';
import { FirestoreModule } from '@angular/fire/firestore';
import {MatBottomSheetModule} from '@angular/material/bottom-sheet';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';






@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, ReactiveFormsModule, MatBottomSheetModule, BrowserAnimationsModule, FirestoreModule,  provideFirebaseApp(() => initializeApp(environment.firebaseConfig)), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideDatabase(() => getDatabase()), provideFirebaseApp(() => initializeApp({"projectId":"socialfitness-cfe71","appId":"1:1084867333737:web:1602f8c17a5e4128969cf8","storageBucket":"socialfitness-cfe71.appspot.com","apiKey":"AIzaSyCSShrAGRDMy0xIdcXXBjL4EYLrFT6kl6U","authDomain":"socialfitness-cfe71.firebaseapp.com","messagingSenderId":"1084867333737","measurementId":"G-B8FVYEKGXP"})), provideStorage(() => getStorage())],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy, }],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(){
    FirebaseTSApp.init(environment.firebaseConfig);
  }
}
