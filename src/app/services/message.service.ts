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

   // This method sends a message to a specific group chat
   async sendMessageToGroupChat(groupId: string, message: Message): Promise<void> {
    console.log('sendMessageToGroupChat called with groupId:', groupId); // Debug log for groupId
    if (!groupId) {
      throw new Error('groupId cannot be empty');
    }
    
    const groupChatRef = doc(this.firestore, `groups/${groupId}`);
    const messagesRef = collection(this.firestore, `${groupChatRef.path}/messages`);
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
  //get messages between users 
  getMessages(groupId: string): Observable<Message[]> {
    const messagesRef = collection(this.firestore, 'groups', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }

  // This method retrieves messages from a specific group chat
  getGroupChatMessages(groupId: string): Observable<Message[]> {
    const groupChatRef = doc(this.firestore, `groups/${groupId}`);
    const messagesRef = collection(this.firestore, `${groupChatRef.path}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
  }
  
  //create conversation with another user.
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

  // This method creates a new group chat when a new group is created
  async createGroupChat(groupId: string, creatorUserId: string): Promise<void> {
    const groupChatRef = doc(this.firestore, `groups/${groupId}`);
    const messagesRef = collection(this.firestore, `${groupChatRef.path}/messages`);
    // Optionally, add an initial system message or leave the messages collection empty
    await addDoc(messagesRef, {
      content: 'Chat created', // Or any other initial message or system notification
      timestamp: Timestamp.fromDate(new Date()),
      senderId: creatorUserId, // The ID of the user who created the chat
      // Add any other relevant fields for the message here
    });
  }

  getConversationsForUser(userId: string): Observable<Conversation[]> {
    const conversationsRef = collection(this.firestore, 'conversations');
    const q = query(conversationsRef, where('participantIds', 'array-contains', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Conversation[]>;
  }
}
