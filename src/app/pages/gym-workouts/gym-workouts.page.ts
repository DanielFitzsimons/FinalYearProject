import { Component, OnInit } from '@angular/core';
import { BluetoothService } from 'src/app/services/bluetooth.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { WorkoutDetails, HeartRateDataPoint } from 'src/app/models/model/model';
import { AlertController } from '@ionic/angular';
import { map } from 'rxjs';
import { ModalController } from '@ionic/angular';
import { DateAndTimePickerPage } from 'src/app/components/date-and-time-picker/date-and-time-picker.page';


@Component({
  selector: 'app-gym-workouts',
  templateUrl: './gym-workouts.page.html',
  styleUrls: ['./gym-workouts.page.scss'],
})
export class GymWorkoutsPage implements OnInit {


  latestHeartRate: number = 0;
  highestHeartRate: number = 0;
  lowestHeartRate: number = 0;


  heartRateDataPoints: any[] = [];

  isSignedIn = false;

  sessionData: any = {};

  caloriesBurned: number = 0;
  startTime: string = ''
  endTime: string = ''

  constructor(private bluetoothService: BluetoothService, private auth: AuthenticationService, private alertController: AlertController, private modalCtrl: ModalController) { }

  async ngOnInit() {
  await this.signInWithGoogle();

  }

  async signInWithGoogle() {
    try {
      await this.bluetoothService.signInWithGoogle();
      this.isSignedIn = true;
      console.log('Google Sign-In successful');
      
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
    this.fetchHeartRateForSession();
    await this.fetchCaloriesBurnedForSession(); // Add this line
  }

  processSessionData(responseData: any) {
    if (responseData && Array.isArray(responseData) && responseData.length > 0) {
      this.sessionData = responseData[0];
  
      // Assuming the latest heart rate is the first in the array
      this.latestHeartRate = this.sessionData.value[0]?.fpVal;
  
      // Calculate the highest and lowest heart rate
      const heartRateValues: number[] = this.sessionData.value.map((dataPoint: HeartRateDataPoint) => dataPoint.fpVal);
      this.highestHeartRate = Math.max(...heartRateValues);
      this.lowestHeartRate = Math.min(...heartRateValues);
    }
  }
  



  async saveWorkout() {
    try {
      const userId = this.auth.getCurrentUser(); // Make sure this method exists and returns the current user's ID.

      this.auth.currentUser$.pipe(
        map(user => user ? user.uid : null) // Extract the user's UID or return null if the user is not authenticated
      ).subscribe(userId => {
        if (userId) {
          // Create workoutData object
          const workoutDetails: WorkoutDetails = {
            userId: userId,
            latestHeartRate: this.latestHeartRate,
            highestHeartRate: this.highestHeartRate,
            lowestHeartRate: this.lowestHeartRate,
            caloriesBurned: this.caloriesBurned,
            timestamp: new Date(),
          };
      
          // Save the workout data
          this.bluetoothService.saveWorkoutDetails(workoutDetails)
          .then(() => {
            console.log("Workout data saved successfully.");
            // Optionally, you can present a summary or success message to the user
          })
          .catch(error => {
            console.error("Error saving workout data:", error);
            // Handle any errors, perhaps with an alert or another form of notification
          });
        } else {
          console.error("User is not authenticated or ID is missing");
          // Optionally, you can prompt the user to sign in or handle the scenario accordingly
        }
      });
      
     
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }
  
async retrieveFitData() {
  // Call the method from the Bluetooth service to retrieve Google Fit data
  try {
    const startTime = '2024-04-19T00:00:00Z'; 
    const endTime = new Date().toISOString(); 
    
    const data = await this.bluetoothService.listDataSources();
    const data1 = await this.bluetoothService.getHeartRateData(startTime, endTime);
    console.log('Google Fit data:', data);
    console.log('Google Fit data1:', data1);
    // Process the retrieved data and update your UI accordingly
  } catch (error) {
    console.error('Failed to retrieve Google Fit data:', error);
    // Handle data retrieval error (e.g., display a message to the user)
  }
}

async fetchActivities() {
  const startTime = this.getStartTimeForActivities(); // Implement this to get the desired start time
  const endTime = new Date(); // For example, to fetch activities up until now

  try {
    const activities = await this.bluetoothService.listActivities(startTime, endTime);
    console.log('Activities fetched:', activities);
    //this.fetchSessionData('32cab5f1d6924c01:watch-activemode:strength_training:1713527385753')
    this.fetchHeartRateForSession();
    // Now you can do something with the activities, like displaying them in the UI
  } catch (error) {
    console.error('Error fetching activities:', error);
  }
}

async fetchHeartRateForSession() {
  if (!this.isSignedIn) {
    console.log('User is not signed in');
    return; // Exit the function if not signed in
  }
  // You need to get these times from your session data
  const sessionStartTime = '1713527385753'; // start time in milliseconds
  const sessionEndTime = '1713778197484'; // end time in milliseconds

  try {
    const heartRateData = await this.bluetoothService.getHeartRateDataForSession(sessionStartTime, sessionEndTime);
    console.log('Heart rate data for session:', heartRateData);
    this.processSessionData(heartRateData); 
   
  } catch (error) {
    console.error('Error fetching heart rate data for session:', error);
  }
}

async fetchCaloriesBurnedForSession() {
  if (!this.isSignedIn) {
    console.log('User is not signed in');
    return; // Exit the function if not signed in
  }
  
  // You need to get these times from your session data
  const sessionStartTime = '1713527385753'; // start time in milliseconds
  const sessionEndTime = '1713778197484';

  try {
    this.caloriesBurned = await this.bluetoothService.getCaloriesBurnedForSession(sessionStartTime, sessionEndTime);
    console.log('Calories burned for session:', this.caloriesBurned);
    this.processSessionData(this.caloriesBurned); 
  } catch (error) {
    console.error('Error fetching calories burned for session:', error);
  }
}

async fetchSessionData(sessionId: string) {
  // Convert the start and end times to milliseconds as strings
  const startTime = this.getStartTimeForActivities(); // Implement this method if not already implemented
  const endTime = new Date();
  const startTimeMillis = startTime.getTime().toString();
  const endTimeMillis = endTime.getTime().toString();

  try {
    // Fetch heart rate data for the session
    const heartRateDataPoints = await this.bluetoothService.getHeartRateDataForSession(startTimeMillis, endTimeMillis);
    console.log('Heart Rate Data Points:', heartRateDataPoints);
    this.heartRateDataPoints = heartRateDataPoints; 
  } catch (error) {
    console.error('Error fetching session data:', error);
  }
}

convertNanosToDate(nanos: string): Date {
  // Convert nanoseconds to milliseconds and create a Date object
  return new Date(parseInt(nanos) / 1000000);
}

getHeartRateValue(valueArray: any[]): number {
  // Assuming the heart rate value is always the first element in the array
  // and that it's either a float value or an int value.
  const value = valueArray[0];
  return value.fpVal || value.intVal;
}

getStartTimeForActivities(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to the start of the current day
  return now;
}

async showSuccessAlert() {
  const alert = await this.alertController.create({
    header: 'Success',
    message: 'Workout saved successfully!',
    buttons: ['OK']
  });

  await alert.present();
}

// Existing function that you can use as a template for fetching heart rate and calorie data
async fetchActivitiesCustom(startTime: string, endTime: string) {
  if (!this.isSignedIn) {
    console.error('User is not signed in');
    return;
  }
  
  try {
    const startMillis = this.toUtcMillis(startTime); // 'startTime' from datetime picker
    const endMillis = this.toUtcMillis(endTime); // 'endTime' from datetime picker
    
    // Fetch heart rate and calorie data
    const heartRateData = await this.bluetoothService.getHeartRateDataForSession(startMillis.toString(), endMillis.toString());
    this.caloriesBurned = await this.bluetoothService.getCaloriesBurnedForSession(startMillis.toString(), endMillis.toString());
    
    // Process and display the data in the UI
    this.processSessionData(heartRateData); // You will need to implement this
    this.processSessionData(this.caloriesBurned); // You will need to implement this

    console.log("Heart Rate Data:", heartRateData)
    console.log("Calories Data:", this.caloriesBurned)
  } catch (error) {
    console.error('Error fetching heart rate or calories data:', error);
  }
}



  async fetchActivitiesCustom1(startTime: string, endTime: string) {
    if (!this.isSignedIn) {
      console.error('User is not signed in');
      return;
    }
    try {
      const activities = await this.bluetoothService.listActivities(new Date(startTime), new Date(endTime));
      console.log('Activities fetched:', activities);
      // Additional processing...
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }

  toUtcMillis(dateTimeString: any) {
    const date = new Date(dateTimeString);
    const timeInMillis = date.getTime();
    const timezoneOffsetInMillis = date.getTimezoneOffset() * 60000;
    return timeInMillis + timezoneOffsetInMillis;
  }

  async openDatePickerModal() {
    const modal = await this.modalCtrl.create({
      component: DateAndTimePickerPage // Your date picker page
    });
  
    modal.onDidDismiss().then((result) => {
      if (result.data) {
        // If data is returned, use it to update your start and end times and fetch data
        this.startTime = result.data.startTime;
        this.endTime = result.data.endTime;
        this.fetchActivitiesCustom(this.startTime, this.endTime);
      }
    });
  
    return await modal.present();
  }

//Below here i was trying to implement the Sessions API which is used to create activities and session for workouts
//but i couldnt seem to sync the heart rate data live after creating a session
// the session would create but heart rate data couldnt be retreved, so i opeted with the implementations above

/* async createSession() {
  const startTime = this.getIrishTime(new Date());
  const endTime = new Date(startTime.getTime() + 7200000); // 2 hours later

  const startTimeGMT = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000);
  const endTimeGMT = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000);

  const sessionId = startTime.toISOString();
  const requestBody = {
    id: sessionId,
    name: "Workout Session",
    description: "Track workout session",
    startTimeMillis: startTimeGMT.getTime(),
    endTimeMillis: endTimeGMT.getTime(),
    type: "fitness.activity.workout",
    application: {
      detailsUrl: "http://example.com",
      name: "Workout Tracker App",
      version: "1"
    }
  };

  try {
    const response = await this.bluetoothService.startGoogleFitSession(sessionId, requestBody);
    console.log("Session started with ID:", sessionId, "Response:", response);
  } catch (error) {
    console.error("Error starting session:", error);
  }
}

getIrishTime(date: Date): Date {
  const STANDARD_TIME_OFFSET = 0; // GMT
  const DAYLIGHT_SAVING_OFFSET = 60; // GMT+1 for daylight saving

  const daylightSavingStart = new Date(Date.UTC(date.getUTCFullYear(), 2, 31)); // March
  const daylightSavingEnd = new Date(Date.UTC(date.getUTCFullYear(), 9, 31)); // October
  daylightSavingStart.setUTCDate(daylightSavingStart.getUTCDate() - daylightSavingStart.getUTCDay());
  daylightSavingEnd.setUTCDate(daylightSavingEnd.getUTCDate() - daylightSavingEnd.getUTCDay());

  let localTimeOffset = STANDARD_TIME_OFFSET;
  if (date >= daylightSavingStart && date < daylightSavingEnd) {
      localTimeOffset = DAYLIGHT_SAVING_OFFSET;
  }

  return new Date(date.getTime() + localTimeOffset * 60000);
}

async startWorkout() {
  try {
    //await this.bluetoothService.subscribeToHeartRate(); // Subscribe before starting the workout
    //console.log('Heart rate subscription successful.');

    this.heartRate = 0; // Reset heart rate
    this.workoutDuration = 0; // Reset workout duration
    this.startTimer();
    this.startHeartRateFetch(); // Start fetching heart rate data
    await this.createSession(); // Create and start a session in Google Fit
  } catch (error) {
    console.error('Error during workout start:', error);
  }
}

resetWorkout() {
// Reset workout variables if needed
this.currentExercise = '';
this.numberOfSets = 0;
this.numberOfReps = 0;
this.workoutDuration = 0;
this.heartRate = 0;
}

startTimer() {
  const startTime = Date.now() - this.workoutDuration; // If resuming, subtract the already elapsed time
  this.workoutTimer = setInterval(() => {
    const currentTime = Date.now();
    this.workoutDuration = (currentTime - startTime) / 1000; // Update duration in seconds
  }, 1000);
}

stopTimer() {
  if (this.workoutTimer) {
    clearInterval(this.workoutTimer);
  }
}

endWorkout() {
  this.stopTimer();
  this.stopHeartRateFetch();
  this.lastExercise = this.currentExercise; // Save last exercise before resetting
  this.currentExercise = ''; // Reset current exercise at the end
  this.numberOfSets = 0;
  this.numberOfReps = 0;
  // Handle session end if applicable
}

formatDuration(durationInSeconds: number): string {
const hours = Math.floor(durationInSeconds / 3600);
const minutes = Math.floor((durationInSeconds % 3600) / 60);
const seconds = Math.floor(durationInSeconds % 60);
return `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
}

pad(num: number): string {
return num < 10 ? `0${num}` : num.toString();
}

// Modify the existing startHeartRateFetch method
startHeartRateFetch() {
  // Fetch initial data once before starting the interval
  this.retrieveFitData();
  this.fetchHeartRateDataForWorkout();

  this.currentHeartRateSimulator = setInterval(() => {
    this.fetchHeartRateDataForWorkout();
  }, 60000); // Update every minute
}

stopHeartRateFetch() {
  if (this.currentHeartRateSimulator) {
    clearInterval(this.currentHeartRateSimulator);
  }
}

async fetchHeartRateDataForWorkout() {
  const now = new Date();
  const startTime = '2024-04-22T00:00:00Z'; 
    const endTime = new Date().toISOString(); 

    try {
      const heartRateDataResponse = await this.bluetoothService.getHeartRateData(startTime, endTime);
      if (heartRateDataResponse) {
        const heartRateValues = heartRateDataResponse.bucket.flatMap(bucket =>
          bucket.dataset.flatMap(dataset =>
            dataset.point.flatMap(point =>
              point.value.map(value => value.fpVal || value.intVal)
            )
          )
        );
        const latestHeartRateValue = heartRateValues.length > 0 ? heartRateValues[heartRateValues.length - 1] : null;
        if (latestHeartRateValue !== null) {
          this.heartRate = latestHeartRateValue;
          console.log(`Updated Heart Rate: ${this.heartRate}`);
        } else {
          console.log('No heart rate data available for the specified time range.');
        }
      }
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
    }
    const heartRate = await this.bluetoothService.getHeartRateData(startTime, endTime);
    if (heartRate !== null) {
      this.heartRate = heartRate; // Update your component's heart rate property
      console.log(`Updated Heart Rate: ${this.heartRate}`);
    } else {
      console.log('No heart rate data available.');
    }
}

// Modify the existing startHeartRateFetch method
startHeartRateFetch() {
  // Fetch initial data once before starting the interval
  this.retrieveFitData();
  this.fetchHeartRateDataForWorkout();

  this.currentHeartRateSimulator = setInterval(() => {
    this.fetchHeartRateDataForWorkout();
  }, 60000); // Update every minute
}

stopHeartRateFetch() {
  if (this.currentHeartRateSimulator) {
    clearInterval(this.currentHeartRateSimulator);
  }
}

*/
}