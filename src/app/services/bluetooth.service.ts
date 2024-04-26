import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { GoogleFitSession, ListSessionsResponse, WorkoutDetails, GoogleFitDataSetsResponse, AggregateResponse } from '../models/model/model';

declare const gapi: any; // Declare gapi namespace




@Injectable({
  providedIn: 'root'
})

export class BluetoothService {

  // URL for the local server proxy to Google Fit API
  private proxyUrl = 'http://localhost:3000/google-fit-api';
  
  // Holds the Google user object after sign-in
  googleUser?: any

  constructor(
    private http: HttpClient, // Injects HttpClient to perform HTTP requests
    private platform: Platform, // Injects Platform to access platform-specific information
    private firestore: Firestore // Injects Firestore for database interactions
  ) {}

  // Asynchronously signs in the user using Google's authentication services
  async signInWithGoogle(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Determines the platform the app is running on
      const platform = this.getPlatform(); 
      let clientId: any;

      // Assigns Client ID based on platform, currently uses the same ID for web and Android
      if (platform === 'web' || platform === 'android') {
        clientId = '655441442254-guigeiqaactq88b6piarkh7aaa2kaccd.apps.googleusercontent.com';
      }

      // Loads Google API client library and initializes it with specified API key and client ID
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: 'AIzaSyAvaRfhLNA6XJMGvKMCl5YOk3ueQzsEyjY',
          clientId: clientId,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest"],
          scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.activity.write https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.heart_rate.write https://www.googleapis.com/auth/fitness.body.read',
          plugin_name: 'Social Fitness'
        }).then(() => {
          // Creates and signs in the user instance
          const auth2 = gapi.auth2.getAuthInstance();
          auth2.signIn().then((googleUser: any) => {
            this.googleUser = googleUser; // Saves the signed-in user
            const profile = googleUser.getBasicProfile();
            console.log('ID: ' + profile.getId()); // Logs the Google user's ID
            resolve(); // Resolves the Promise indicating successful sign-in
          });
        });
      });
    });
  }
  
  // Returns a string indicating the platform the app is running on
  getPlatform(): string {
    if (this.platform.is('android')) {
      return 'android';
    } else if (this.platform.is('ios')) {
      return 'ios';
    } else if (this.platform.is('desktop')) {
      return 'web'; // Treats any desktop environment as 'web'
    } else {
      return 'unknown'; // Fallback for unknown platforms
    }
  }

  // Fetches aggregated Google Fit data for a specific time range
  async getGoogleFitData(startTime: string, endTime: string): Promise<any> {
    try {
      // Calls Google Fit API to aggregate data over specified time period
      const response = await gapi.client.fitness.users.dataset.aggregateBy({
        userId: 'me', // Refers to the authenticated user
        requestBody: {
          startTimeMillis: new Date(startTime).getTime(),
          endTimeMillis: new Date(endTime).getTime(),
          aggregateBy: [{dataTypeName: 'com.google.step_count.delta'}],
          bucketByTime: {durationMillis: 86400000}, // Aggregates data into daily buckets
        },
      });
  
      console.log("Aggregate request:", response); // Logs the aggregated data response
      return response.result;
    } catch (error) {
      console.error('Error fetching Google Fit data:', error); // Logs any errors encountered
      throw error; // Re-throws the error for handling elsewhere
    }
  }
  
  // Lists data sources available in Google Fit for the authenticated user
  async listDataSources(): Promise<any> {
    try {
      // Calls Google Fit API to list available data sources
      const response = await gapi.client.fitness.users.dataSources.list({
        userId: 'me', // Refers to the authenticated user
      });
  
      console.log("Data sources:", response.result); // Logs the list of data sources
      return response.result;
    } catch (error) {
      console.error('Error listing data sources:', error); // Logs any errors encountered
      throw error; // Re-throws the error for handling elsewhere
    }
  }

async listActivities(startTime: Date, endTime: Date): Promise<GoogleFitSession[]> {
  if (!this.googleUser) { //check if user is signed in
    throw new Error('User not signed in');
  }

  const accessToken = this.googleUser.getAuthResponse().access_token; //get access token from response
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  });

  //change the times to a string
  const startTimeMillis = startTime.getTime().toString(); 
  const endTimeMillis = endTime.getTime().toString();

  // Correctly constructing the query parameters
  const params = new HttpParams()
    .set('startTime', startTimeMillis)
    .set('endTime', endTimeMillis)
    .set('includeDeleted', 'false');

  try {
    const response = await this.http.get<ListSessionsResponse>(
      `https://www.googleapis.com/fitness/v1/users/me/sessions`, {
        headers,
        params // Make sure to pass params here
      }
    ).toPromise();

    if (response && response.session) {
      console.log(response.session) // log the response
      return response.session; 
    } else {
      throw new Error('No sessions returned from Google Fit');
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error; // Propagate error to be handled by caller
  }
}


async listActivities1(startTime: Date, endTime: Date): Promise<GoogleFitSession[]> {
  if (!this.googleUser) {
    throw new Error('User not signed in');
  }

  const accessToken = this.googleUser.getAuthResponse().access_token;
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  });

  const startTimeMillis = startTime.getTime().toString();
  const endTimeMillis = endTime.getTime().toString();

  try {
    const response = await this.http.get<ListSessionsResponse>(
      `https://www.googleapis.com/fitness/v1/users/me/sessions`,
      { headers }
    ).pipe(
      catchError((err) => {
        console.error('Error fetching activities:', err);
        return throwError(err); // or return of([]) if you want to return an empty array on error
      })
    ).toPromise();

    if (response) {
      return response.session; // Replace 'session' with the correct field from response if different
    } else {
      throw new Error('Response was undefined.');
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    throw error; // Rethrow the error if you want to handle it in the component
  }
}


// Method to get heart rate data for a specific session
async getHeartRateDataForSession(startTimeMillis: string, endTimeMillis: string): Promise<any[]> {
  if (!this.googleUser) {
    throw new Error('User not signed in');
  }

  const accessToken = this.googleUser.getAuthResponse().access_token;
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  });

  const requestBody = {
    aggregateBy: [{
      dataTypeName: 'com.google.heart_rate.bpm' //query the heart rate data 
    }],
    bucketByTime: { durationMillis: parseInt(endTimeMillis) - parseInt(startTimeMillis) },
    startTimeMillis: startTimeMillis,
    endTimeMillis: endTimeMillis
  };

  try {
    const response = await this.http.post<GoogleFitDataSetsResponse>(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      requestBody,
      { headers }
    ).toPromise();

    // Ensure the response is not undefined and has the expected structure
    if (response && response.bucket) {
      // Flatten the array of buckets and extract heart rate data points
      const heartRateDataPoints = response.bucket.flatMap(bucket =>
        bucket.dataset.flatMap(dataset => dataset.point)
      );
      return heartRateDataPoints;
    } else {
      return []; // No data points found
    }
  } catch (error) {
    console.error('Error fetching heart rate data points for session:', error);
    throw error;
  }
}

// Method to get calories data for a specific session
async getCaloriesBurnedForSession(startTimeMillis: string, endTimeMillis: string): Promise<number> {
   // Checks if the Google user is signed in; throws an error if not
   if (!this.googleUser) {
    throw new Error('User not signed in');
  }

  // Retrieves the access token from the signed-in Google user
  const accessToken = this.googleUser.getAuthResponse().access_token;
  // Sets up headers for the HTTP request, including the Authorization token and content type
  const headers = new HttpHeaders({
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  });

  // Defines the request body for the Google Fit API to aggregate calorie data
  const requestBody = {
    aggregateBy: [{dataTypeName: 'com.google.calories.expended'}], // Specifies the type of data to aggregate
    bucketByTime: { durationMillis: parseInt(endTimeMillis) - parseInt(startTimeMillis) }, // Sets the aggregation period to the session duration
    startTimeMillis: startTimeMillis, // Start time of the data aggregation
    endTimeMillis: endTimeMillis // End time of the data aggregation
  };

  try {
    // Makes an HTTP POST request to Google Fit API's dataset:aggregate endpoint
    const response = await this.http.post<AggregateResponse>(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      requestBody,
      { headers }
    ).toPromise();

    // Checks if the response contains data points
    if (response && response.bucket && response.bucket.length > 0) {
      // Extracts and aggregates calorie data from the response
      const caloriesData = response.bucket[0].dataset[0].point.reduce((totalCalories, point) => {
        const calories = point.value[0].fpVal || point.value[0].intVal || 0; // Retrieves calorie value from the data point
        return totalCalories + calories; // Aggregates total calories
      }, 0);

      return caloriesData; // Returns aggregated calorie data
    } else {
      return 0; // No data points found, return 0 calories burned
    }
  } catch (error) {
    console.error('Error fetching calories burned data for session:', error); // Logs error to console
    throw error; // Throws error for handling in the calling function
  }
}

// Method to save workout details to Firebase
async saveWorkoutDetails(workoutData: WorkoutDetails): Promise<void> {
  try {
    const userRunsRef = collection(this.firestore, `users/${workoutData.userId}/gym`); // Reference to the collection in Firestore
    const docRef = await addDoc(userRunsRef, {
      ...workoutData,
      timestamp: new Date() // Sets the timestamp when saving the data
    }); // Adds workout data to Firestore

    console.log("Workout saved with ID: ", docRef.id); // Logs successful save with document ID
  } catch (error) {
    console.error("Error adding workout data: ", error); // Logs error adding workout data
  }
}

}

/**async startGoogleFitSession(sessionId: string, sessionData: any): Promise<any> {
    const url = `${this.proxyUrl}/sessions/${sessionId}`; // Include session ID in the URL
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + this.googleUser.getAuthResponse().access_token,
      'Content-Type': 'application/json'
    });
    const response = await this.http.put(url, sessionData, { headers }).toPromise(); // Use HTTP PUT
    return response;
}



  async endGoogleFitSession(sessionId: string): Promise<any> {
    const url = `${this.proxyUrl}/sessions/${sessionId}/end`; // Update URL
    const headers = new HttpHeaders({
      'Authorization': 'Bearer ' + this.googleUser.getAuthResponse().access_token,
      'Content-Type': 'application/json'
    });
    const endTime = new Date().getTime();
    const requestBody = {
      endTimeMillis: endTime
    };
    const response = await this.http.put(url, requestBody, { headers }).toPromise();
    return response;
  } 
  
  async getHeartRateData(startTime: any, endTime: any): Promise<number | null> {
  try {
      if (!this.googleUser) {
          throw new Error('User not signed in');
      }

      const accessToken = this.googleUser.getAuthResponse().access_token;
      const headers = new Headers({
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
      });

      const requestBody = {
          aggregateBy: [{
              dataTypeName: "com.google.heart_rate.bpm",
              dataSourceId: "derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm"
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: new Date(startTime).getTime(),
          endTimeMillis: new Date(endTime).getTime()
      };

      const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
          console.error('Non-OK HTTP response', response.status, await response.text());
          return null;
      }

      const data = await response.json();
      console.log("Full Google Fit heart rate data response:", data); // Detailed logging

      
      
    // Extract heart rate values along with their timestamps
    const heartRateValues = data.bucket.flatMap((bucket: GoogleFitBucket) =>
      bucket.dataset.flatMap((dataset: GoogleFitDataSet) =>
        dataset.point.flatMap((point: GoogleFitHeartRatePoint) => {
          // Ensure you have a timestamp field here, like startTimeMillis or endTimeMillis
          const timestamp = point.startTimeMillis; // Replace with actual timestamp field
          return point.value.map((value: { intVal?: number, fpVal?: number }) => ({
            value: value.fpVal || value.intVal,
            timestamp: timestamp
          }));
        })
      )
    );

    // Sort the values by timestamp in descending order
    const sortedHeartRates = heartRateValues.sort((a: any, b: any) => b.timestamp - a.timestamp);

    // Get the most recent heart rate value
    const mostRecentHeartRate = sortedHeartRates.length > 0 ? sortedHeartRates[0].value : null;
    console.log(`Most recent heart rate: ${mostRecentHeartRate}`);
  
    return mostRecentHeartRate; // Return the most recent heart rate value or null
    
  } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return null; 
  }
}*/