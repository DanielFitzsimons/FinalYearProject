import { Timestamp } from "@angular/fire/firestore";

// models.ts

export interface User {
    id: string;
    name: string;
    // ... other user properties ...
  }
  
 
  
  export interface Conversation {
    id: string;
    participantIds: string[];
    lastMessage: string;
    lastMessageTimestamp: Date;
    otherUserName?: string;
    // ... other conversation properties ...
  }

  export interface Message {
    id?: string;
    conversationId: string;
    sender: string;
    content: string;
    timestamp: Timestamp;
  }
  

  export interface Team{
    id?: string;
    groupName: string;
    groupDescription?: string;
    members: string[];
  }