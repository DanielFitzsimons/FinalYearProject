import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { HttpHeaders } from '@angular/common/http';
import { GoogleFitBucket, GoogleFitDataSet, GoogleFitHeartRatePoint, GoogleFitHeartRateResponse } from '../models/model/model';
declare const gapi: any; // Declare gapi namespace



@Injectable({
  providedIn: 'root'
})

export class BluetoothService {

 
  private proxyUrl = 'http://localhost:3000/google-fit-api';

  googleUser?: any

  constructor(private http: HttpClient,
    private platform: Platform
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
          scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.activity.write https://www.googleapis.com/auth/fitness.heart_rate.read',
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
              dataSourceId: "derived:com.google.heart_rate.bpm:com.google.android.fit:samsung:SM-R910:e962275f:top_level"
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

      // Check for heart rate data points and log them
      
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
  
  async listSubscriptions() {
    // This will need an OAuth2 token with the right scopes
    const accessToken = this.googleUser.getAuthResponse().access_token;
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/subscriptions', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
  
    if (!response.ok) {
      throw new Error('Failed to list subscriptions');
    }
  
    const data = await response.json();
    console.log('Active subscriptions:', data);
    // This logs active subscriptions. Ensure 'com.google.heart_rate.bpm' is listed.
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


}
