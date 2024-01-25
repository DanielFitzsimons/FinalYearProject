import { Component, OnInit } from '@angular/core';
import { Message, MessageService } from 'src/app/services/message.service';
import { Observable, map } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { Firestore, collection } from '@angular/fire/firestore';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserProfileService } from 'src/app/services/user-profile.service';

@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.page.html',
  styleUrls: ['./messaging.page.scss'],
})
export class MessagingPage implements OnInit {
  conversations!: Conversation[];
  newMessage?: string;
  otherUserName?: string;
  messages!: Observable<Message[]>;

  currentUserId?: string;
  currentConversationId?: string;

  users$!: Observable<User[]>;

  constructor(
    private messageService: MessageService,
    private firestore: Firestore,
    private auth: AuthenticationService,
    private userProfileService: UserProfileService
  ) {}

  ngOnInit() {
    // Ensure the user is authenticated before accessing the user profile
    if (this.auth.isAuthenticatedUser()) {
      this.userProfileService.getUserProfile().subscribe(
        (userProfileData) => {
          // Handle the user profile data if needed
          this.currentUserId = userProfileData?.uid;
        },
        (error) => {
          console.error('Error getting user profile:', error);
        }
      );
    } else {
      console.error('User not authenticated');
      // Handle the case where the user is not authenticated
    }
  }

  openConversation(conversation: Conversation) {
    this.otherUserName = conversation.otherUserName;
    this.messages = this.messageService.getMessages(conversation.id);
  }

  async send() {
    if (this.newMessage && this.currentConversationId) {
      const message: Message = {
        conversationId: this.currentConversationId,
        sender: this.currentUserId!, // 'sender' instead of 'senderId'
        content: this.newMessage,
        timestamp: Timestamp.fromDate(new Date()),
      };
      await this.messageService.sendMessage(this.currentConversationId, message);
      this.newMessage = ''; // Clear the input
    }
  }

  async openConversationWithUser(user: User) {
    let conversation = this.conversations.find((con) =>
      con.participantIds.includes(user.id)
    );
    if (!conversation) {
      // Start a new conversation if none exists
      conversation = await this.startConversationWithUser(user);
      // Check if a conversation was successfully created
      if (!conversation) {
        // Handle the case where the conversation could not be created
        return;
      }
    }

    // Now we're sure conversation is defined, proceed to open it
    this.currentConversationId = conversation.id;
    this.messages = this.messageService.getMessages(this.currentConversationId);
  }

  // Inside MessagingPage class
  async startConversationWithUser(otherUser: User): Promise<Conversation> {
    // Ensure that currentUserId is defined
    if (!this.currentUserId) {
      throw new Error('Current user ID is not set');
    }

    const participants = [
      { userId: this.currentUserId, userName: 'Your Name' }, // Use actual data
      { userId: otherUser.id, userName: otherUser.name },
    ];

    // Now we're sure this.currentUserId is not undefined,
    // we can safely proceed with creating the conversation
    const newConversationId = await this.messageService.createConversation(
      participants
    );

    // Assuming newConversationId is the ID of the new conversation
    // Create a new conversation object to return
    const newConversation: Conversation = {
      id: newConversationId,
      participantIds: participants.map((p) => p.userId as string), // Type assertion since we checked above
      lastMessage: '',
      lastMessageTimestamp: new Date(), // Use the current date as a placeholder
      otherUserName: otherUser.name,
    };

    // Add the new conversation to the local state
    this.conversations.push(newConversation);

    // Return the new conversation object
    return newConversation;
  }
}

export interface Conversation {
  id: string; // Unique identifier for the conversation
  participantIds: string[]; // Array of user IDs of the participants
  lastMessage: string; // The last message sent in this conversation
  lastMessageTimestamp: Date; // Timestamp of the last message
  otherUserName?: string; // Name of the other user in the conversation (for one-on-one chats)
  // Add other relevant properties as needed
}

export interface User {
  id: string;
  name: string;
  // ... other user properties ...
}
