// profile.page.ts
import { Component, OnInit } from '@angular/core';
import { Firestore, doc, getDoc, collectionData, updateDoc, collection, } from '@angular/fire/firestore';
import { AuthenticationService } from '../../services/authentication.service';
import { FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { UserProfileService } from 'src/app/services/user-profile.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: any; // The user object
  uid: string = ''; // The UID of the user

  // Observable to store user profile data from Firestore collection
  userProfileData$ = collectionData(collection(this.firestore, 'users'));

  // Flag to toggle the visibility of profile data in the template
  showProfileData: boolean = false;

  // Form group for user profile data with default values and validators
  profileForm = this.fb.group({
    email: [{ value: '', disabled: true }, Validators.required], // Email is disabled for editing
    name: ['', Validators.required],
    age: ['', Validators.min(18)],
    phoneNumber: ['', Validators.minLength(10)],
    address: ['', Validators.required],
  });

  // Constructor with dependency injection
  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
  ) { }

  // Lifecycle hook called after component initialization
  ngOnInit() {
    // Retrieve the currently authenticated user
    const user = this.auth.getCurrentUser();
    
    // Check if a user is authenticated
    if (user) {
      this.uid = user.uid; // Set UID
      this.user = user; // Set user object
  
      // Check if UID is defined
      if (this.uid) {
        // Use the UserProfileService to get user profile data
        this.userProfileService.getUserProfile().subscribe(
          (userProfileData) => {
            // Populate the form with the retrieved user profile data
            this.profileForm.patchValue({
              email: this.user?.email,
              ['name']: userProfileData?.name || '',
              ['age']: userProfileData?.age || '',
              ['phoneNumber']: userProfileData?.phoneNumber || '',
              ['address']: userProfileData?.address || '',
            });
            this.showProfileData = true;
          },
          (error) => {
            console.error(error);
          }
        );
      } else {
        console.error('User UID is undefined or null.');
      }
    } else {
      console.error('User not authenticated');
    }

    // Initialize the observable with the user profiles collection

    // Retrieve data from the Firestore collection named 'users'
    this.userProfileData$ = collectionData(collection(this.firestore, 'users')).pipe(
      // Apply the map operator to transform the emitted array of user profiles
      map(userProfiles => 
        // Use the filter function to include only profiles with matching email
        userProfiles.filter(profile => profile['email'] === this.user?.email)
      )
    );

  }

  // Method to update user profile data
  onSave() {
    this.userProfileService.updateUserProfile(this.profileForm).subscribe(
      () => {
        console.log('User profile updated successfully!');
        this.showProfileData = true;
        this.profileForm.reset();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  onUpdate(fieldName: string) {
    const fieldValue = this.profileForm.get(fieldName)?.value;
  
    if (this.uid && fieldValue !== undefined) {
      this.userProfileService.updateUserProfileField(this.uid, fieldName, fieldValue).subscribe(
        () => {
          console.log(`Field '${fieldName}' updated successfully in user profile!`);
          this.showProfileData = true;
        },
        (error) => {
          console.error(`Error updating field '${fieldName}' in user profile: `, error);
        }
      );
    } else {
      console.error('User UID is undefined or null or field value is undefined.');
    }
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

  // Method to delete a specific field from user profile
  onDelete(fieldToDelete: string) {
    // Ensure that UID is defined and not empty
    if (this.uid) {
      // Construct the document reference for the user profile
      const userProfileRef = doc(this.firestore, `users/${this.uid}`);

      // Fetch the existing user profile document
      getDoc(userProfileRef).then((docSnap) => {
        if (docSnap.exists()) {
          // If the document exists, update it by removing the specified field
          const updatedData = { [fieldToDelete]: null };

          // Use the updateDoc method to remove the specified field
          updateDoc(userProfileRef, updatedData)
            .then(() => {
              console.log(`Field '${fieldToDelete}' deleted successfully from user profile!`);
              this.showProfileData = true; // Set flag to show profile data in the template
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


}
