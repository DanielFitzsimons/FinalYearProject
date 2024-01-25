import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, setDoc, query, orderBy, Timestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Message {
  id?: string;
  conversationId: string;
  sender: string;
  content: string;
  timestamp: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private firestore: Firestore) {}

  getUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<User[]>;
  }

  async sendMessage(conversationId: string, message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: Timestamp.fromDate(new Date())
    });
  }

  getMessages(conversationId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

    // New method to create a new conversation
    async createConversation(participants: {userId: string, userName: string}[]): Promise<string> {
      const conversationsRef = collection(this.firestore, 'conversations');
      const newConversationData = {
        participantIds: participants.map(u => u.userId),
        participantsInfo: participants, // You may store additional info like user names
        // ... other initial conversation properties
      };
      const conversationDocRef = await addDoc(conversationsRef, newConversationData);
      return conversationDocRef.id; // Return the new conversation ID
    }
}

export interface User {
  id: string;
  name: string;
 
}
