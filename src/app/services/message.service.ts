import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, query, orderBy, Timestamp, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Conversation, Message, User } from '../models/model/model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  constructor(private firestore: Firestore) {}

  // Method to fetch users from Firestore
getUsers(): Observable<User[]> {
  // Get a reference to the 'users' collection
  const usersRef = collection(this.firestore, 'users');
  // Retrieve the users data as an observable
  return collectionData(usersRef, { idField: 'id' }) as Observable<User[]>;
}

  /* async sendMessage(conversationId: string, message: Message): Promise<void> {
    const messagesRef = collection(this.firestore, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      ...message,
      timestamp: message.timestamp || Timestamp.fromDate(new Date()), // Use provided timestamp or current time
    });
  } */

  // Method to send a message to a group chat
async sendMessage(groupId: string, message: Message): Promise<void> {
  // Get a reference to the 'messages' subcollection of the specified group
  const messagesRef = collection(this.firestore, 'groups', groupId, 'messages');
  // Add the message to the group's messages subcollection
  await addDoc(messagesRef, {
    ...message,
    timestamp: message.timestamp || Timestamp.fromDate(new Date()), // Use provided timestamp or current time
  });
}

  // Method to send a message to a specific group chat
async sendMessageToGroupChat(groupId: string, message: Message): Promise<void> {
  // Log a debug message with the provided groupId
  console.log('sendMessageToGroupChat called with groupId:', groupId);
  // Check if the groupId is empty
  if (!groupId) {
    throw new Error('groupId cannot be empty');
  }
  
  // Get a reference to the document for the specified group
  const groupChatRef = doc(this.firestore, `groups/${groupId}`);
  // Get a reference to the 'messages' subcollection of the group
  const messagesRef = collection(this.firestore, `${groupChatRef.path}/messages`);
  // Add the message to the group's messages subcollection
  await addDoc(messagesRef, {
    ...message,
    timestamp: message.timestamp || Timestamp.fromDate(new Date()), // Use provided timestamp or current time
  });
}
  
  
  // Method to retrieve messages between users in a group
getMessages(groupId: string): Observable<Message[]> {
  // Get a reference to the 'messages' subcollection of the specified group
  const messagesRef = collection(this.firestore, 'groups', groupId, 'messages');
  // Define a query to order messages by timestamp in ascending order
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  // Retrieve the messages data as an observable
  return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
}

// Method to retrieve messages from a specific group chat
getGroupChatMessages(groupId: string): Observable<Message[]> {
  // Get a reference to the document for the specified group
  const groupChatRef = doc(this.firestore, `groups/${groupId}`);
  // Get a reference to the 'messages' subcollection of the group
  const messagesRef = collection(this.firestore, `${groupChatRef.path}/messages`);
  // Define a query to order messages by timestamp in ascending order
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  // Retrieve the messages data as an observable
  return collectionData(q, { idField: 'id' }) as Observable<Message[]>;
}

// Method to create a conversation with another user
async createConversation(participants: { userId: string, userName: string }[]): Promise<string> {
  // Get a reference to the 'conversations' collection
  const conversationsRef = collection(this.firestore, 'conversations');
  // Prepare data for the new conversation
  const newConversationData = {
    participantIds: participants.map(u => u.userId), // IDs of the conversation participants
    participantsInfo: participants, // Additional info like user names
    lastMessage: '', // Placeholder for the last message
    lastMessageTimestamp: Timestamp.fromDate(new Date()), // Placeholder for the last message timestamp
  };
  // Add the new conversation data to the 'conversations' collection
  const conversationDocRef = await addDoc(conversationsRef, newConversationData);
  // Return the ID of the newly created conversation
  return conversationDocRef.id;
}

// Method to create a new group chat when a new group is created
async createGroupChat(groupId: string, creatorUserId: string): Promise<void> {
  // Get a reference to the document for the specified group
  const groupChatRef = doc(this.firestore, `groups/${groupId}`);
  // Get a reference to the 'messages' subcollection of the group
  const messagesRef = collection(this.firestore, `${groupChatRef.path}/messages`);
  // Add an initial system message to the group chat
  await addDoc(messagesRef, {
    content: 'Chat created', // Initial message content
    timestamp: Timestamp.fromDate(new Date()), // Timestamp for the initial message
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
