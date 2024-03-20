import { Timestamp } from "@angular/fire/firestore";
import { FieldValue } from "@angular/fire/firestore";
// models.ts

export interface User {
    uid: string;
    id: string;
    name: string;
    email: string;
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
    groupId?: string; // Optionally add groupId for group messages
    sender: string;
    senderName: string;
    content: string;
    timestamp: Timestamp;
  }
  
 
export interface Post {
  id?: string; // Optional because Firebase generates the ID
  authorId: string;
  content: string;
  timestamp: Date; // You'll use server timestamps from Firebase
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
  }