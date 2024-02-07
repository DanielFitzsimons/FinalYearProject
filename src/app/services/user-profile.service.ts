import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, updateDoc, collectionData, deleteDoc, addDoc, query, where } from '@angular/fire/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  imageData: any;

  groupId?: string;
 

  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private storage: Storage,
  ) { }

  
  
  // Retrieve the user's profile data for a given UID
getUserProfile(uid: string): Observable<any> {
  console.log(`Fetching user profile for UID: ${uid}`); // Debug log
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
}


 

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

 // Create a post with optional image
 createPost(userId: string, postContent: string, groupId: string, imageFile?: File): Observable<string | void> {
  const postCollectionRef = collection(this.firestore, 'posts');
  let postData: any = {
    userId,
    content: postContent,
    groupId, // Include groupId in the post data
    timestamp: new Date(),
  };

  return new Observable<string | void>((observer) => {
    if (imageFile) {
      const storageRef = ref(this.storage, `post-images/${imageFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
          postData.imageUrl = downloadURL;
          addDoc(postCollectionRef, postData).then((docRef) => {
            observer.next(docRef.id);
          }).catch((error) => observer.error('Error creating a post: ' + error));
        }).catch((error) => observer.error('Error getting download URL: ' + error));
      }).catch((error) => observer.error('Error uploading image: ' + error));
    } else {
      // If there's no image file, proceed to create the post without an imageUrl
      addDoc(postCollectionRef, postData).then((docRef) => {
        observer.next(docRef.id);
      }).catch((error) => observer.error('Error creating a post: ' + error));
    }
  });
}


  

  
  
editPost(postId: string, updatedContent: string): Observable<void> {
  const postRef = doc(this.firestore, `posts/${postId}`);
  const updatedData = { content: updatedContent };

  return new Observable<void>((observer) => {
    updateDoc(postRef, updatedData) 
      .then(() => {
        observer.next();
      })
      .catch((error) => {
        observer.error('Error updating post: ' + error);
      });
  });
}

// Delete a post
deletePost(postId: string, userId: string): Observable<void> {
  const postRef = doc(this.firestore, `posts/${postId}`);

  return new Observable<void>((observer) => {
    getDoc(postRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const postData: any = docSnap.data();

          console.log('postData.userId:', postData.userId);
          console.log('userId:', userId);

          // Ensure the post belongs to the authenticated user
          if (postData.userId === userId) {
            deleteDoc(postRef)
              .then(() => {
                observer.next();
                observer.complete(); // Make sure to complete the observable
              })
              .catch((error) => {
                observer.error('Error deleting post: ' + error);
              });
          } else {
            observer.error('You are not authorized to delete this post.');
          }
        } else {
          observer.error('Post not found');
        }
      })
      .catch((error) => {
        observer.error('Error fetching post data: ' + error);
      });
  });
}
 
// Get all posts
getPosts(): Observable<any[]> {
  const postCollectionRef = collection(this.firestore, 'posts');
  return collectionData(postCollectionRef, { idField: 'postId' }).pipe(
    map((posts) => posts.map((post) => ({ id: post.postId, ...post })))
  );
}

getPostsByGroupId(groupId: string): Observable<any[]> {
  const postCollectionRef = collection(this.firestore, 'posts');
  const q = query(postCollectionRef, where('groupId', '==', groupId));
  return collectionData(q, { idField: 'postId' }).pipe(
    map((posts) => posts.map((post) => ({ id: post.postId, ...post })))
  );
}

// Method to fetch and set groupId based on user membership
getGroupIdForUser(userId: string): Observable<string | null> {
  const groupsCollectionRef = collection(this.firestore, 'groups');
  const q = query(groupsCollectionRef, where('members', 'array-contains', userId));
  return collectionData(q, { idField: 'groupId' }).pipe(
    map((groups) => groups.length ? groups[0].groupId : null)
  );
}



}



