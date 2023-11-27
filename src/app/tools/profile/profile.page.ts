import { Component, OnInit, Input } from '@angular/core';
import { Firestore, collectionData } from '@angular/fire/firestore'
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { FirebaseTSAuth } from 'firebasets/firebasetsAuth/firebaseTSAuth';
import { FirebaseTSFirestore} from 'firebasets/firebasetsFirestore/firebaseTSFirestore';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  
  @Input() show: boolean = false;
  name: string = '';
  description: string = '';

  users$ = collectionData(collection(this.firestore, 'users')) as Observable<User[]>;

  constructor(private firestore: Firestore) {}

  ngOnInit() {}

  // Function to write data to Firestore
  async writeToFirestore() {
    const userDocRef = doc(this.firestore, 'users', 'user_id'); // Replace 'user_id' with a unique identifier for the user
    const userData = { name: this.name, description: this.description };

    await updateDoc(userDocRef, userData);
  }

}

export interface User{
  name: string;
  description: string;

}
