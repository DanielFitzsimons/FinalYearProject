import { Timestamp } from "@angular/fire/firestore";

// models.ts

export interface User {
    uid: string;
    id: string;
    name: string;
    email: string;
  }
  
  // activity.model.ts
export interface Activity {
  id?: string;
  userId: string;
  type: 'run' | 'gym';
  //date: Date;
  distance?: number; // For runs
  elapsedTime?: number; // For runs and gym sessions
  caloriesBurned?: number; // For gym sessions
  pace?: number;
  timestamp: any;
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

  export interface GoogleFitHeartRatePoint {
    value: Array<{ intVal: number }>;
  }
  
  export interface GoogleFitDataSet {
    point: GoogleFitHeartRatePoint[];
  }
  
  export interface GoogleFitBucket {
    dataset: GoogleFitDataSet[];
  }
  
  export interface GoogleFitHeartRateResponse {
    bucket: GoogleFitBucket[];
  }
  
