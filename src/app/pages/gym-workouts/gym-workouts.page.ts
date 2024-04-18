import { Component, OnInit } from '@angular/core';
import { BluetoothService } from 'src/app/services/bluetooth.service';
@Component({
  selector: 'app-gym-workouts',
  templateUrl: './gym-workouts.page.html',
  styleUrls: ['./gym-workouts.page.scss'],
})
export class GymWorkoutsPage implements OnInit {

  currentExercise: string = '';
  numberOfSets: number = 0;
  numberOfReps: number = 0;
  heartRate: number = 0; // This will be updated with real data from the smartwatch
  workoutDuration: number = 0; // Duration in seconds
  workoutTimer: any; // This will hold our interval for the workout timer
  currentHeartRateSimulator: any; // Holds the interval ID for
  currentSessionId: any;
  lastExercise: string = '';

  constructor(private bluetoothService: BluetoothService) { }

  async ngOnInit() {
    try {
      await this.signInWithGoogle(); // Ensure Google is signed in on component load
    } catch (error) {
      console.error("Error initializing Google sign-in:", error);
    }
  }

  async signInWithGoogle() {
    try {
      await this.bluetoothService.signInWithGoogle();
      console.log('Google Sign-In successful');
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  }

  async startWorkout() {
    this.heartRate = 0; // Reset heart rate
    this.workoutDuration = 0; // Reset workout duration
    this.startTimer();
    this.startHeartRateFetch(); // Start fetching heart rate data
    await this.createSession(); // Create and start a session in Google Fit
}

async createSession() {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 7200000); // 2 hours later

  // Convert start and end times to GMT
  const startTimeGMT = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000);
  const endTimeGMT = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000);

  const sessionId = startTime.toISOString(); // Keep using ISO string for session ID

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
    console.log("Session started with ID:", sessionId);
    return response;
  } catch (error) {
    console.error("Error starting session:", error);
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

saveWorkout() {
  // Function to save the workout details
  console.log("Workout Saved:", this.lastExercise, this.workoutDuration);
  // Add logic to save workout data to local storage or remote database
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

// Add a new method to fetch heart rate data for a given time period
async fetchHeartRateDataForWorkout() {
  const now = new Date(); // Current date and time
  const offset = now.getTimezoneOffset(); // Get the current time zone offset in minutes
  const startTime = new Date(now.getTime() - this.workoutDuration * 1000 - (offset * 60 * 1000)); // Adjust start time to GMT
  const endTime = new Date(now.getTime() - (offset * 60 * 1000)); // Adjust end time to GMT
  
  try {
    const heartRateData = await this.bluetoothService.getHeartRateData(startTime, endTime);
    if (heartRateData && heartRateData.bucket && heartRateData.bucket.length > 0) {
      // Assuming the Google Fit response has a bucket property
      // You will need to adjust the access here based on the actual structure of the response
      const lastBucket = heartRateData.bucket[heartRateData.bucket.length - 1];
      const lastDataSet = lastBucket.dataset[0]; // Assuming there is at least one dataset
      const lastDataPoint = lastDataSet.point[0]; // Assuming there is at least one data point
      
      this.heartRate = lastDataPoint.value[0].intVal; // Update the heart rate
      console.log(`Updated Heart Rate: ${this.heartRate}`);
    }
  } catch (error) {
    console.error('Error fetching heart rate data:', error);
  }
}

// Modify the existing startHeartRateFetch method
startHeartRateFetch() {
  // Fetch initial data once before starting the interval
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




async retrieveFitData() {
  // Call the method from the Bluetooth service to retrieve Google Fit data
  try {
    const startTime = '2024-04-12T01:17:00Z'; 
    const endTime = new Date().toISOString(); 
    
    const data = await this.bluetoothService.listDataSources();
    const data1 = await this.bluetoothService.getHeartRateData(startTime, endTime);
    console.log('Google Fit data:', data);
    console.log('Google Fit data:', data1);
    // Process the retrieved data and update your UI accordingly
  } catch (error) {
    console.error('Failed to retrieve Google Fit data:', error);
    // Handle data retrieval error (e.g., display a message to the user)
  }
}




}
