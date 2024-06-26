// Import necessary Angular and Firebase modules, services, and dependencies
import { Component, OnInit,  } from '@angular/core';
import { Firestore, doc, getDoc, collectionData, updateDoc, collection } from '@angular/fire/firestore';
import { AuthenticationService } from '../../services/authentication.service';
import { FormBuilder, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Activity, Gym, Run } from 'src/app/models/model/model';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: any; // The user object
  uid: string = ''; // The UID of the user
  private loading: any;
  private authStateSubscription!: Subscription; 

  // Observable to store user profile data from Firestore collection
  userProfileData$ = collectionData(collection(this.firestore, 'users'));

  // Flag to toggle the visibility of profile data in the template
  showProfileData: boolean = false;

  showForm: boolean = false;

  selectedSegment: 'runs' | 'gym' = 'runs';
  activities: Activity[] = [];

  runsData$!: Observable<Run[]>;
  gymData$!: Observable<Gym[]> 


  // Form group for user profile data with default values and validators
  profileForm = this.fb.group({
    email: [{ value: '', disabled: true }, Validators.required], // Email is disabled for editing
    name: ['', Validators.required],
    age: ['', Validators.min(18)],
  });

  // Constructor with dependency injection
  constructor(
    private firestore: Firestore,
    private auth: AuthenticationService,
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private loadingController: LoadingController,
  ) { }

  // Lifecycle hook called after component initialization
  ngOnInit() {
    // Subscribe to the auth state observable
    this.authStateSubscription = this.auth.currentUser$.subscribe(
      user => {
        if (user) {
          // User is authenticated
          this.uid = user.uid;
          this.user = user;

          // Now that you have the user, you can load the profile
          this.loadUserProfile(this.uid);
          this.fetchActivities();
          this.runsData$ = this.userProfileService.getUserActivities(this.uid, 'runs');
          this.gymData$ = this.userProfileService.getUserActivities(this.uid, 'gym');
        } else {
          // User is not authenticated, handle accordingly
          console.error('User not authenticated');
        }
      },
      error => {
        console.error('Error in auth subscription:', error);
      }
    );

    // Retrieve data from the Firestore collection named 'users'
    this.userProfileData$ = collectionData(collection(this.firestore, 'users')).pipe(
      // Apply the map operator to transform the emitted array of user profiles
      map(userProfiles =>
        // Use the filter function to include only profiles with matching email
        userProfiles.filter(profile => profile['email'] === this.user?.email)
      )
    );


  }

// In profile.page.ts
fetchActivities() {
  // Clear the current activities to prevent display of old data
  this.activities = [];

  if (this.uid) {
    if (this.selectedSegment === 'runs') {
      this.runsData$ = this.userProfileService.getUserRuns(this.uid);
    } else {
      this.gymData$ = this.userProfileService.getUserGyms(this.uid);
    }
  }
}

  // Function to load user profile data
loadUserProfile(uid: string) {
  this.userProfileService.getUserProfile(uid).subscribe(
    (userProfileData) => {
      // Check if userProfileData exists and has data
      if (userProfileData) {
        // Populate the form with the retrieved user profile data
        this.profileForm.patchValue({
          email: userProfileData.email, // Assuming 'email' is a field in the userProfileData
          name: userProfileData.name, // Assuming 'name' is a field in the userProfileData
          age: userProfileData.age, // Assuming 'age' is a field in the userProfileData
        });
        // Show the profile data in the template
        this.showProfileData = true;
      } else {
        // Handle the case where no user profile data was found
        console.error('No profile data found for this user.');
      }
    },
    error => {
      // Handle any errors that occur during subscription to userProfileData
      console.error('Error fetching profile:', error);
    }
  );
}


  // Method to update user profile data
  async onSave(profile: any) {
    try {
      //this.presentLoading(); // Show loading indicator

      if (this.uid) {
        const userProfileRef = doc(this.firestore, `users/${this.uid}`);
        await updateDoc(userProfileRef, profile);
        console.log('User profile updated successfully!');
        this.showProfileData = true;
      } else {
        console.error('User UID is undefined or null.');
      }
    } catch (error) {
      console.error('Error updating user profile: ', error);
    } finally {
      //this.dismissLoading(); // Dismiss loading indicator regardless of success or error
    }
  }

  async onUpdate(fieldName: string) {
    const fieldValue = this.profileForm.get(fieldName)?.value;

    try {
      if (this.uid && fieldValue !== undefined) {
        // Perform the update operation
        await this.userProfileService.updateUserProfileField(this.uid, fieldName, fieldValue).toPromise();
        console.log(`Field '${fieldName}' updated successfully in user profile!`);
        this.showProfileData = true;
      } else {
        console.error('User UID is undefined or null or field value is undefined.');
      }
    } catch (error) {
      console.error(`Error updating field '${fieldName}' in user profile: `, error);
    }
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Saving data...',
      spinner: 'dots', 
    });
    await this.loading.present();
  }

  // Method to dismiss loading indicator
  async dismissLoading() {
    if (this.loading) {
      await this.loading.dismiss();
    }
  }

  
  onFileChanged(event: Event) {
    const input = event.target as HTMLInputElement; // Cast to HTMLInputElement
    if (input && input.files && input.files.length) {
      const file = input.files[0];
      this.uploadFile(file);
    }
  }
  
  
  
  uploadFile(file: File) {
    // Call a method from the user profile service to handle the upload
    this.userProfileService.uploadProfilePicture(file).then((url: string) => {
      // Assuming you have a method to update the user profile
      this.updateUserProfilePicture(url);
    });
  }
  
  updateUserProfilePicture(imageUrl: string) {
    // Ensure there's a UID available
    if (!this.uid) {
      console.error('User UID is undefined or null.');
      return;
    }
  
    // Use the UID to update the user profile with the new image URL
    this.userProfileService.updateUserProfileField(this.uid, 'picture', imageUrl)
      .subscribe({
        next: () => {
          // Handle successful update
          console.log('Profile picture updated successfully.');
        },
        error: (error) => {
          console.error('Error updating profile picture:', error);
        }
      });
  }
  
}
