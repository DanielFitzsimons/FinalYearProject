import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs'; 
import { collection } from 'firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class UserProfileServiceService {

  constructor(private firestore: Firestore) { }


  
}
