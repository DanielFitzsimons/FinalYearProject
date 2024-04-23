import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { GoogleFitBucket, GoogleFitDataSet, GoogleFitHeartRatePoint, GoogleFitHeartRateResponse, GoogleFitSession, ListSessionsResponse, WorkoutDetails } from '../models/model/model';

declare const gapi: any; // Declare gapi namespace

interface GoogleFitDataSetsResponse {
  dataset: GoogleFitDataSet[];
  bucket: GoogleFitDataSetsResponse[];
}

interface HeartRateDataPointValue {
  intVal?: number;
  fpVal?: number;
  // Add other possible fields from the data point value
}

interface HeartRateDataPoint {
  startTimeNanos: string;
  endTimeNanos: string;
  value: HeartRateDataPointValue[];
  // Add other fields from the data point if needed
}

// Define the structure for the expected API response
interface DataSet {
  point: HeartRateDataPoint[];
}

// Define the structure for a bucket which includes the datasets
interface DataSetBucket {
  dataset: DataSet[];
}

// Define the structure for the expected API response
interface AggregateResponse {
  bucket: DataSetBucket[];
}


@Injectable({
  providedIn: 'root'
})

export class BluetoothService {

 
  private proxyUrl = 'http://localhost:3000/google-fit-api';

   private sessions: GoogleFitSession[] = []

  googleUser?: any

  constructor(private http: HttpClient,
    private platform: Platform,
    private firestore: Firestore
  ) {
 
  }
  

  async signInWithGoogle(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Determine which platform the app is running on
      const platform = this.getPlatform(); // You would implement this method
      let clientId: any;
      
      // Assign Client ID based on platform
      if (platform === 'web') {
        clientId = '655441442254-guigeiqaactq88b6piarkh7aaa2kaccd.apps.googleusercontent.com';
      } else if (platform === 'android') {
        clientId = '655441442254-guigeiqaactq88b6piarkh7aaa2kaccd.apps.googleusercontent.com';
      }
  
      // Load the gapi client and the auth2 library
      gapi.load('client:auth2', () => {
        gapi.client.init({
          apiKey: 'AIzaSyAvaRfhLNA6XJMGvKMCl5YOk3ueQzsEyjY',
          clientId: clientId,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/fitness/v1/rest"],
          scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.activity.write https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.heart_rate.write https://www.googleapis.com/auth/fitness.body.read',
          plugin_name: 'Social Fitness'
        }).then(() => {
          const auth2 = gapi.auth2.getAuthInstance();
          auth2.signIn().then((googleUser: any) => {
            this.googleUser = googleUser; // Set googleUser object
            const profile = googleUser.getBasicProfile();
            console.log('ID: ' + profile.getId()); // Log profile info
            resolve();
          });
        });
      });
    });
  }
  
  
  getPlatform(): string {
    if (this.platform.is('android')) {
      return 'android';
    } else if (this.platform.is('ios')) {
      return 'ios';
    } else if (this.platform.is('desktop')) {
      return 'web'; // Assume any desktop platform means web
    } else {
      return 'unknown'; // Default case if none of the above
    }
  }

  async startGoogleFitSession(sessionId: string, sessionData: any): Promise<any> {
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
}

  async getGoogleFitData(startTime: string, endTime: string): Promise<any> {
    try {
      const response = await gapi.client.fitness.users.dataset.aggregateBy({
        userId: 'me',
        requestBody: {
          startTimeMillis: new Date(startTime).getTime(),
          endTimeMillis: new Date(endTime).getTime(),
          aggregateBy: [{
            dataTypeName: 'com.google.step_count.delta', // replace with the desired data type
            // dataSourceId: 'your_specific_data_source_id_here' // Optional: use only if needed
          }],
          bucketByTime: {
            durationMillis: 86400000, // The number of milliseconds in one day
          },
        },
      });
  
      console.log("Aggregate request:", response);
      return response.result;
    } catch (error) {
      console.error('Error fetching Google Fit data:', error);
      throw error;
    }
  }
  
async listDataSources(): Promise<any> {
  try {
    const response = await gapi.client.fitness.users.dataSources.list({
      userId: 'me',
    });

    console.log("Data sources:", response.result);
    return response.result;
  } catch (error) {
    console.error('Error listing data sources:', error);
    throw error;
  }
}

async listActivities(startTime: Date, endTime: Date): Promise<GoogleFitSession[]> {
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
      return response.session; // Assuming 'session' is the correct field name
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
      dataTypeName: 'com.google.heart_rate.bpm'
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
      dataTypeName: 'com.google.calories.expended'
    }],
    bucketByTime: { durationMillis: parseInt(endTimeMillis) - parseInt(startTimeMillis) },
    startTimeMillis: startTimeMillis,
    endTimeMillis: endTimeMillis
  };

  try {
    const response = await this.http.post<AggregateResponse>(
      `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      requestBody,
      { headers }
    ).toPromise();

    if (response && response.bucket && response.bucket.length > 0) {
      // The structure of the response may vary. You might need to adjust this logic to fit the actual response structure.
      const caloriesData = response.bucket[0].dataset[0].point.reduce((totalCalories, point) => {
        const calories = point.value[0].fpVal || point.value[0].intVal || 0;
        return totalCalories + calories;
      }, 0);

      return caloriesData;
    } else {
      return 0; // No data points found
    }
  } catch (error) {
    console.error('Error fetching calories burned data for session:', error);
    throw error;
  }
}


async saveWorkoutDetails(workoudData: WorkoutDetails): Promise<void> {
  try {
    const userRunsRef = collection(this.firestore, `users/${workoudData.userId}/gym`);
    const docRef = await addDoc(userRunsRef, {
      ...workoudData,
      timestamp: new Date() // set the timestamp when saving the data
    });
    console.log("Workout saved with ID: ", docRef.id);
  } catch (error) {
    console.error("Error adding run data: ", error);
    
  }
}

}