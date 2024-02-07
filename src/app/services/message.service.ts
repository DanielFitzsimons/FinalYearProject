import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, query, orderBy, Timestamp, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Conversation, Message, User } from '../models/model/model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private firestore: Firestore) {}

  getUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'id' }) as Observable<User[]>;
  }

  /* async sendMessage(conversationId: string, message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: message.timestamp || Timestamp.fromDate(new Date()), // Use provided timestamp or current time
    });
  } */

  async sendMessage(groupId: string, message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'groups', groupId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: message.timestamp || Timestamp.fromDate(new Date()),
    });
  }
  

  /* getMessages(conversationId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc')); // Ensure messages are ordered correctly
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  } */

  getMessages(groupId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'groups', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }
  

  async createConversation(participants: { userId: string, userName: string }[]): Promise<string> {
    const conversationsRef = collection(this.firestore, 'conversations');
    const newConversationData = {
      participantIds: participants.map(u => u.userId),
      participantsInfo: participants, // Additional info like user names
      lastMessage: '',
      lastMessageTimestamp: Timestamp.fromDate(new Date()), // Placeholder for the last message timestamp
    };
    const conversationDocRef = await addDoc(conversationsRef, newConversationData);
    return conversationDocRef.id; // Return the new conversation ID
  }

  getConversationsForUser(userId: string): Observable<Conversation[]> {
    const conversationsRef = collection(this.firestore, 'conversations');
    const q = query(conversationsRef, where('participantIds', 'array-contains', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Conversation[]>;
  }
}
