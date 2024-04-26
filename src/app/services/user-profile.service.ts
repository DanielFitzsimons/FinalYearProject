import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, updateDoc, collectionData, deleteDoc, addDoc, query, where } from '@angular/fire/firestore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthenticationService } from './authentication.service';
import { Observable, throwError, Subject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { RunData, Activity, Run } from '../models/model/model';
import { Gym } from '../models/model/model';
@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  imageData: any;

  groupId?: string;

   // A subject to emit upload progress
   private uploadProgress = new Subject<number>();
   // Observable to expose to components
   public uploadProgress$ = this.uploadProgress.asObservable();
 

  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private storage: Storage,
  ) { }

  
  
 // Method to retrieve the user's profile data for a given UID
getUserProfile(uid: string): Observable<any> {
  console.log(`Fetching user profile for UID: ${uid}`); // Log a debug message
  const userProfileRef = doc(this.firestore, `users/${uid}`); // Reference to the user's profile document
  // Return an observable that emits the user profile data
  return new Observable<any>((observer) => {
    // Asynchronously fetch the user profile document
    getDoc(userProfileRef).then((docSnap) => {
      if (docSnap.exists()) {
        // If the document exists, extract and emit the user profile data
        const userProfileData: any = docSnap.data();
        observer.next(userProfileData);
      } else {
        // If the document doesn't exist, emit an error
        observer.error('User profile not found');
      }
    }).catch((error) => {
      // If an error occurs during fetching, emit an error
      observer.error('Error fetching user profile data: ' + error);
    });
  });
}

// Method to update a specific field in the user's profile
updateUserProfileField(uid: string, fieldName: string, fieldValue: any): Observable<void> {
  // Check if the UID is provided
  if (uid) {
    // Get a reference to the user's profile document
    const userProfileRef = doc(this.firestore, `users/${uid}`);
    // Prepare the updated data object
    const updatedData = { [fieldName]: fieldValue };
    // Return an observable that emits void when the update is successful
    return new Observable<void>((observer) => {
      // Asynchronously update the user profile document
      updateDoc(userProfileRef, updatedData).then(() => {
        // If the update is successful, emit void
        observer.next();
      }).catch((error) => {
        // If an error occurs during updating, emit an error
        observer.error('Error updating user profile field: ' + error);
      });
    });
  } else {
    // If the UID is not provided, emit an error
    return new Observable<void>((observer) => {
      observer.error('User UID is undefined or null.');
    });
  }
}



  
 // Method to update user profile data
updateUserProfile(uid: string, formData: FormGroup): Observable<void> {
  // Check if the UID is provided and form data is valid
  if (uid && formData.valid) {
    // Get a reference to the user's profile document
    const userProfileRef = doc(this.firestore, `users/${uid}`);
    // Extract the new profile data from the form
    const newProfile = formData.value;
    // Return an observable that emits void when the update is successful
    return new Observable<void>((observer) => {
      // Asynchronously update the user profile document
      updateDoc(userProfileRef, newProfile).then(() => {
        // If the update is successful, emit void and complete the observer
        observer.next();
        observer.complete();
      }).catch((error) => {
        // If an error occurs during updating, emit an error
        observer.error('Error updating user profile: ' + error);
      });
    });
  } else {
    // If the UID is not provided or form data is invalid, emit an error
    return throwError(() => 'User not authenticated or form is invalid');
  }
}

// Method to create a post in a group
createPost(userId: string, postContent: string, groupId: string, imageFile?: File): Observable<string | void> {
  // Get a reference to the document for the specified group
  const groupDocRef = doc(this.firestore, 'groups', groupId);
  // Get a reference to the 'posts' collection within the group
  const postCollectionRef = collection(groupDocRef, 'posts');
  
  // Return an observable that handles post creation
  return this.getUserProfile(userId).pipe(
    switchMap((userProfile) => {
      // Prepare post data object
      let postData: any = {
        userId,
        userName: userProfile.name, // Assuming the username is stored under the key 'userName'
        content: postContent,
        timestamp: new Date(),
      };

      // Return a new observable to handle post creation process
      return new Observable<string | void>((observer) => {
        // If an image file is provided, handle image upload
        if (imageFile) {
          const storageRef = ref(this.storage, `post-images/${imageFile.name}`);
          const uploadTask = uploadBytesResumable(storageRef, imageFile);

          // Handle image upload task
          uploadTask.then((snapshot) => {
            getDownloadURL(snapshot.ref).then((downloadURL) => {
              postData.imageUrl = downloadURL;
              // Add the post data to the 'posts' collection
              addDoc(postCollectionRef, postData).then((docRef) => {
                observer.next(docRef.id); // Emit the ID of the newly created post
              }).catch((error) => observer.error('Error creating a post: ' + error));
            }).catch((error) => observer.error('Error getting download URL: ' + error));
          }).catch((error) => observer.error('Error uploading image: ' + error));
        } else {
          // If no image file is provided, create the post without an imageUrl
          addDoc(postCollectionRef, postData).then((docRef) => {
            observer.next(docRef.id); // Emit the ID of the newly created post
          }).catch((error) => observer.error('Error creating a post: ' + error));
        }
      });
    }),
    catchError((error) => {
      // Catch any errors that occur during the post creation process
      console.error('Error fetching user profile for post creation: ', error);
      return throwError(() => new Error('Error fetching user profile for post creation'));
    })
  );
}

  
  
// Method to edit a post within a group
editPost(groupId: string, postId: string, updatedContent: string): Observable<void> {
  // Get a reference to the specific post document
  const postRef = doc(this.firestore, `groups/${groupId}/posts/${postId}`);
  console.log("Post ID: ", postId); // Log the post ID for debugging purposes
  const updatedData = { content: updatedContent }; // Prepare the updated data object

  // Return an observable to handle the post update process
  return new Observable<void>((observer) => {
    // Asynchronously update the post document
    updateDoc(postRef, updatedData)
      .then(() => {
        observer.next(); // Emit void when the update is successful
      })
      .catch((error) => {
        observer.error('Error updating post: ' + error); // Emit an error if updating fails
      });
  });
}

// Method to delete a post within a group
deletePost(groupId: string, postId: string, userId: string): Observable<void> {
  // Get a reference to the specific post document
  const postRef = doc(this.firestore, `groups/${groupId}/posts/${postId}`);
  console.log("Post ID: ", postId); // Log the post ID for debugging purposes

  // Return an observable to handle the post deletion process
  return new Observable<void>((observer) => {
    // Asynchronously fetch the post document
    getDoc(postRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const postData: any = docSnap.data(); // Extract post data from the document

          console.log('postData.userId:', postData.userId);
          console.log('userId:', userId);

          // Check if the user is authorized to delete the post
          if (postData.userId === userId) {
            // If authorized, delete the post document
            deleteDoc(postRef)
              .then(() => {
                observer.next(); // Emit void when the deletion is successful
                observer.complete();
              })
              .catch((error) => {
                observer.error('Error deleting post: ' + error); // Emit an error if deletion fails
              });
          } else {
            observer.error('You are not authorized to delete this post.'); // Emit an error if unauthorized
          }
        } else {
          observer.error('Post not found'); // Emit an error if the post document doesn't exist
        }
      })
      .catch((error) => {
        observer.error('Error fetching post data: ' + error); // Emit an error if fetching fails
      });
  });
}

// Method to get all posts within a group
getPosts(): Observable<any[]> {
  const postCollectionRef = collection(this.firestore, 'groups/${groupId}/posts'); // Get a reference to the 'posts' collection
  // Return an observable that emits an array of post data
  return collectionData(postCollectionRef, { idField: 'postId' }).pipe(
    map((posts) => posts.map((post) => ({ id: post.postId, ...post }))) // Map post data to include post ID
  );
}


// Method to fetch posts based on a specific group ID
getPostsByGroupId(groupId: string): Observable<any[]> {
  const postCollectionRef = collection(doc(this.firestore, 'groups', groupId), 'posts'); // Get reference to the 'posts' collection within the specified group
  const q = query(postCollectionRef); // Form a query to fetch all documents within the collection
  // Return an observable that emits an array of post data
  return collectionData(q, { idField: 'postId' }).pipe(
    map((posts) => posts.map((post) => ({ id: post.postId, ...post }))) // Map post data to include post ID
  );
}

// Method to fetch and set the groupId based on user membership
getGroupIdForUser(userId: string): Observable<string | null> {
  const groupsCollectionRef = collection(this.firestore, 'groups'); // Get reference to the 'groups' collection
  const q = query(groupsCollectionRef, where('members', 'array-contains', userId)); // Form a query to find groups where the user is a member
  // Return an observable that emits the groupId if the user is a member of at least one group, otherwise emits null
  return collectionData(q, { idField: 'groupId' }).pipe(
    map((groups) => groups.length ? groups[0].groupId : null) // Extract the groupId from the first group, if it exists
  );
}

// Method to upload a profile picture to Firebase Storage
uploadProfilePicture(file: File): Promise<string> {
  const path = `profilePictures/${new Date().getTime()}_${file.name}`; // Generate a unique path for the profile picture
  const storageRef = ref(this.storage, path); // Get a reference to the storage location
  const uploadTask = uploadBytesResumable(storageRef, file); // Start the upload task

  // Return a promise to handle the upload process asynchronously
  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed', // Listen for upload state changes
      (snapshot) => {
        // Optional: monitor upload progress
      },
      (error) => reject(error), // If an error occurs during upload, reject the promise with the error
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => { // When upload completes, get the download URL
          resolve(downloadURL); // Resolve the promise with the download URL
        });
      }
    );
  });
}


// Method to save run data to Firestore
saveRunData(runData: RunData): Promise<void> {
  const userRunsRef = collection(this.firestore, `users/${runData.userId}/runs`); // Reference to the collection where run data will be stored
  // Add the run data document to the collection
  return addDoc(userRunsRef, {
    ...runData,
    timestamp: new Date() // Set the timestamp when saving the data
  }).then(docRef => {
    console.log("Run data saved with ID: ", docRef.id); // Log the ID of the saved document
  }).catch(error => {
    console.error("Error adding run data: ", error); // Log any errors that occur during the process
    throw new Error(error); // Throw an error to handle it further if needed
  });
}

// Retrieve activities (runs or gym sessions) for a specific user
getUserActivities(userId: string, selectedSegment: "runs" | "gym"): Observable<Activity[]> {
  console.log(`Fetching ${selectedSegment} for user ${userId}`);
  const collectionRef = collection(this.firestore, `users/${userId}/${selectedSegment}`);
  return this.fetchActivities(collectionRef);
}

// Fetch activities (runs or gym sessions) from Firestore
private fetchActivities(collectionRef: any): Observable<Activity[]> {
  console.log("Fetching activities from Firestore");
  return collectionData(collectionRef).pipe(
    map(documents => {
      console.log("Documents:", documents);
      return documents.map(doc => this.mapToActivity(doc));
    }),
    catchError(error => {
      console.error('Error fetching user activities: ', error);
      return throwError(() => error);
    })
  );
}


// Map Firestore document data to Activity object
private mapToActivity(doc: any): Activity {
  const distanceInMeters = doc.distance;
  const distanceInKilometers = distanceInMeters / 1000; // Convert meters to kilometers
  const elapsedTimeInSeconds = doc.elapsedTime;
  const pace = doc.pace;
  const timestamp = doc.timestamp.toDate();
  const userId = doc.userId;

  return {
    type: 'run', // or 'gym' depending on the activity type
    distance: distanceInKilometers,
    elapsedTime: elapsedTimeInSeconds,
    pace,
    timestamp,
    userId,
   
  };

}

  getUserGyms(userId: string): Observable<Gym[]> {
  // Reference to the gyms collection for the specified user
  const gymsRef = collection(this.firestore, `users/${userId}/gym`);
  
  // Fetch gyms data from Firestore and map it to Gym objects
  return collectionData(gymsRef).pipe(
    map(docs => docs.map(this.mapToGym)) // Map each document to a Gym object using mapToGym method
  );
}

getUserRuns(userId: string): Observable<Run[]> {
  // Reference to the runs collection for the specified user
  const gymsRef = collection(this.firestore, `users/${userId}/runs`);
  //fetch runs data and map it to runs object
  return collectionData(gymsRef).pipe(
    map(docs => docs.map(this.mapToRun)) // Map each document to a Run object using mapToGym method
  );
}

/**
 * Map Firestore document data to a Run object.
 * @param {any} doc - Firestore document containing run data.
 * @returns {Run} - Run object with mapped data.
 */
private mapToRun(doc: any): Run {
  // Extract data from the Firestore document
  const distanceInMeters = doc.distance;
  const distanceInKilometers = distanceInMeters / 1000; // Convert meters to kilometers
  const elapsedTimeInSeconds = doc.elapsedTime;
  const pace = doc.pace;
  const timestamp = doc.timestamp.toDate();
  const userId = doc.userId;

  // Return a Run object with the extracted data
  return {
    type: 'run', // or 'gym' depending on the activity type
    distance: distanceInKilometers,
    elapsedTime: elapsedTimeInSeconds,
    pace,
    timestamp,
    userId,
    // ... any other fields that are relevant to a Run activity
  };
}

// Map Firestore document data to Gym object
private mapToGym(doc: any): Gym {
  // Extract data from the Firestore document
  const highestHeartRate = doc.highestHeartRate;
  const latestHeartRate = doc.latestHeartRate;
  const lowestHeartRate = doc.lowestHeartRate;
  const caloriesBurned = doc.caloriesBurned;
  const timestamp = doc.timestamp.toDate();
  const userId = doc.userId;

  // Return a Gym object with the extracted data
  return {
    type: 'gym',
    highestHeartRate,
    latestHeartRate,
    lowestHeartRate,
    caloriesBurned,
    timestamp,
    userId,
  };
}




}



