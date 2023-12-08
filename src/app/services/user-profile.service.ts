import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, updateDoc, setDoc, collectionData } from '@angular/fire/firestore';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private fb: FormBuilder,
  ) { }

  // Retrieve the user's profile data
  getUserProfile(): Observable<any> {
    const user = this.auth.getCurrentUser();

    if (user) {
      const uid = user.uid;
      const userProfileRef = doc(this.firestore, `users/${uid}`);

      return new Observable<any>((observer) => {
        getDoc(userProfileRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userProfileData: any = docSnap.data();
            observer.next(userProfileData);
          } else {
            observer.error('User profile not found');
          }
        }).catch((error) => {
          observer.error('Error fetching user profile data: ' + error);
        });
      });
    } else {
      return new Observable<any>((observer) => {
        observer.error('User not authenticated');
      });
    }
  }

  // UserProfileService.service.ts

updateUserProfileField(uid: string, fieldName: string, fieldValue: any): Observable<void> {
  if (uid) {
    const userProfileRef = doc(this.firestore, `users/${uid}`);
    const updatedData = { [fieldName]: fieldValue };

    return new Observable<void>((observer) => {
      updateDoc(userProfileRef, updatedData).then(() => {
        observer.next();
      }).catch((error) => {
        observer.error('Error updating user profile field: ' + error);
      });
    });
  } else {
    return new Observable<void>((observer) => {
      observer.error('User UID is undefined or null.');
    });
  }
}


  // Update user profile data
  updateUserProfile(formData: FormGroup): Observable<void> {
    const user = this.auth.getCurrentUser();

    if (user && formData.valid) {
      const uid = user.uid;
      const userProfileRef = doc(this.firestore, `users/${uid}`);
      const newProfile = formData.value;

      return new Observable<void>((observer) => {
        updateDoc(userProfileRef, newProfile).then(() => {
          observer.next();
        }).catch((error) => {
          observer.error('Error updating user profile: ' + error);
        });
      });
    } else {
      return new Observable<void>((observer) => {
        observer.error('User not authenticated or form is invalid');
      });
    }
  }

  createPost(userId: string, postContent: string, imageFile: File): Observable<void> {
    const postCollectionRef = collection(this.firestore, 'posts');
    const formData = new FormData();
  
    // Append post data
    formData.append('userId', userId);
    formData.append('content', postContent);
  
    // Check if an image file is provided
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
  
    return new Observable<void>((observer) => {
      setDoc(doc(postCollectionRef), formData).then(() => {
        observer.next();
      }).catch((error) => {
        observer.error('Error creating a post: ' + error);
      });
    });
  }
  

  getPosts(): Observable<any[]> {
    const postCollectionRef = collection(this.firestore, 'posts');
  
    return collectionData(postCollectionRef).pipe(
      map((posts) => posts.map((post) => ({ id: post['id'], ...post })))
    );
  }
}
