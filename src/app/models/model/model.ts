import { Timestamp } from "@angular/fire/firestore";

// models.ts

export interface User {
    uid: string;
    id: string;
    name: string;
    email: string;
  }
  

export interface Activity {
  id?: string;
  userId: string;
  type: 'run' | 'gym';
  highestHeartRate?: number;
  latestHeartRate?: number;
  lowestHeartRate?: number; // Add this property
  distance?: number; // For runs
  elapsedTime?: number; // For runs and gym sessions
  caloriesBurned?: number; // For gym sessions
  pace?: number;
  timestamp: any;
}

export interface Run{
  type: 'run' | 'gym';
  id?: string;
  userId: string;
  distance?: number; // For runs
  elapsedTime?: number; // For runs and gym sessions
  pace?: number;
  timestamp: any;
}

export interface Gym{
  type: 'run' | 'gym';
  highestHeartRate?: number;
  latestHeartRate?: number;
  lowestHeartRate?: number; // Add this property
  id?: string;
  userId: string;
  timestamp: any;
  caloriesBurned?: number; // For gym sessions
}

 
  
  export interface Conversation {
    id: string;
    participantIds: string[];
    lastMessage: string;
    lastMessageTimestamp: Date;
    otherUserName?: string;
   
  }

  export interface Message {
    id?: string;
    conversationId?: string; // Make conversationId optional
    groupId?: string; 
    sender: string;
    senderName: string;
    content: string;
    timestamp: Timestamp;
  }
  
 
export interface Post {
  id?: string; // Optional because Firebase generates the ID
  authorId: string;
  content: string;
  timestamp: Date | null; // You'll use server timestamps from Firebase
  groupId: string; // The ID of the group this post belongs to
  userName: string;
  imageUrl: string;
}


  export interface Team{
    id?: string;
    groupName: string;
    groupDescription?: string;
    members: string[];
    lastMessage: string;
    creatorId?: string;
  }

  export interface RunData {
    userId: string; // or any identifier for the user
    distance: number; // distance of the run
    pace: number; // average pace
    elapsedTime: number; // time in milliseconds
    timestamp: Date; // date and time when the run was logged
    
  }

  export interface WorkoutDetails{
    userId: any;
    duration?: any; 
    heartRate?: any;
    latestHeartRate?: number;
    highestHeartRate?: number;
    lowestHeartRate?: number;
    caloriesBurned?: number;
    timestamp: Date; // date and time when the run was logged
  }

  export interface HeartRateDataPoint {
    fpVal: number;
    
  }

  export interface GoogleFitHeartRateValue {
    intVal?: number;  // Integer value, optional because not all points will have it
    fpVal?: number;   // Floating-point value, optional because not all points will have it
  }
  
  export interface GoogleFitHeartRatePoint {
    startTimeMillis?: number; // Timestamp when the data point starts, optional
    endTimeMillis?: number;   // Timestamp when the data point ends, optional
    value: GoogleFitHeartRateValue[];
  }
  
  export interface GoogleFitDataSet {
    point: GoogleFitHeartRatePoint[];
    bucket: GoogleFitHeartRateResponse[];
  }
  
  export interface GoogleFitBucket {
    dataset: GoogleFitDataSet[];
  }
  
  export interface GoogleFitHeartRateResponse {
    bucket: GoogleFitBucket[];
  }

  export interface GoogleFitSession {
    id: string;
    name: string;
    description: string;
    // Add other session properties you need
  }

  export interface ListSessionsResponse {
    session: GoogleFitSession[];
    // Add other response properties as needed
  }
  
  
