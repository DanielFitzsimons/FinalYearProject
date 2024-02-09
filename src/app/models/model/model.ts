import { Timestamp } from "@angular/fire/firestore";

// models.ts

export interface User {
    id: string;
    name: string;
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
    conversationId?: string; // Make conversationId optional
    groupId?: string; // Optionally add groupId for group messages
    sender: string;
    senderName: string;
    content: string;
    timestamp: Timestamp;
  }
  
  

  export interface Team{
    id?: string;
    groupName: string;
    groupDescription?: string;
    members: string[];
    lastMessage: string;
  }