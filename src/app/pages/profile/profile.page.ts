import { Component, OnInit } from '@angular/core';
import { Firestore, doc, getDoc, collectionData, updateDoc, collection, setDoc, deleteDoc } from '@angular/fire/firestore';
import { AuthenticationService } from '../../services/authentication.service';
import { FormBuilder, Validators } from '@angular/forms';
import { FieldValue } from '@angular/fire/firestore';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: any;
  uid: string = ''; // Change to uid

  userProfileData$ = collectionData(collection(this.firestore, 'users'));

  showProfileData: boolean = false;

  profileForm = this.fb.group({
    email: [{ value: '', disabled: true }, Validators.required], 
    name: ['', Validators.required],
    age: ['', Validators.min(18)],
    phoneNumber: ['', Validators.minLength(10)],
    address: ['', Validators.required],
  });

  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (user) {
      this.uid = user.uid; // Use uid instead of email
      this.user = user; // Set the user object
  
      if (this.uid) {
        const userProfileRef = doc(this.firestore, `users/${this.uid}`);
        console.log('Profile Reference Path:', userProfileRef.path);
  
        getDoc(userProfileRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userProfileData: any = docSnap.data();
            this.profileForm.patchValue({
              email: this.user?.email,
              ['name']: userProfileData?.name || '',
              ['age']: userProfileData?.age || '',
              ['phoneNumber']: userProfileData?.phoneNumber || '',
              ['address']: userProfileData?.address || '',
            });
            this.showProfileData = true;
          } else {
            console.error('User profile not found');
          }
          
        });
      } else {
        console.error('User UID is undefined or null.');
      }
    } else {
      console.error('User not authenticated');
    }
  
    this.userProfileData$ = collectionData(collection(this.firestore, 'users'));
  }
  
  onUpdate() {
    this.updateUserProfile();
    this.profileForm.reset();
  }

  

  // onDelete() {
  //   // Ensure that this.uid is defined and not empty
  //   if (this.uid) {
  //     // Construct the document reference with a valid path
  //     const userProfileRef = doc(this.firestore, `users/${this.uid}`);
  
  //     // Get the existing document data
  //     getDoc(userProfileRef)
  //       .then((docSnap) => {
  //         if (docSnap.exists()) {
  //           // Extract the email field
  //           const { email } = docSnap.data();
  
  //           // Create a new object with only the email field
  //           const updatedData = { email };
  
  //           // Update the document with the new object
  //           setDoc(userProfileRef, updatedData, { merge: true })
  //             .then(() => {
  //               console.log('User profile updated successfully!');
  //               this.showProfileData = true; // Show profile data after update
  //             })
  //             .catch((error) => {
  //               console.error('Error updating user profile: ', error);
  //             });
  //         } else {
  //           console.error('User profile not found');
  //         }
  //       })
  //       .catch((error) => {
  //         console.error('Error fetching user profile data: ', error);
  //       });
  //   } else {
  //     console.error('User UID is undefined or null.');
  //   }
  // }


  onDelete(fieldToDelete: string) {
    // Ensure that this.uid is defined and not empty
    if (this.uid) {
      // Construct the document reference with a valid path
      const userProfileRef = doc(this.firestore, `users/${this.uid}`);
  
      // Get the existing document data
      getDoc(userProfileRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            // Update the document by removing the specified field
            const updatedData = { [fieldToDelete]: null };
  
            // Use the updateDoc method to remove the specified field
            updateDoc(userProfileRef, updatedData)
              .then(() => {
                console.log(`Field '${fieldToDelete}' deleted successfully from user profile!`);
                this.showProfileData = true; // Show profile data after update
              })
              .catch((error) => {
                console.error(`Error deleting field '${fieldToDelete}' from user profile: `, error);
              });
          } else {
            console.error('User profile not found');
          }
        })
        .catch((error) => {
          console.error('Error fetching user profile data: ', error);
        });
    } else {
      console.error('User UID is undefined or null.');
    }
  }


  updateUserProfile() {
    if (this.profileForm.valid) {
      const newProfile = this.profileForm.value;

      // Use the DocumentReference to update the user's profile in Firestore
      const userProfileRef = doc(this.firestore, `users/${this.uid}`);
      updateDoc(userProfileRef, newProfile)
        .then(() => {
          console.log('User profile updated successfully!');
          this.showProfileData = true; // Show profile data after submission
          this.profileForm.reset();
        })
        .catch((error) => {
          console.error('Error updating user profile: ', error);
        });
    }
  }
}
