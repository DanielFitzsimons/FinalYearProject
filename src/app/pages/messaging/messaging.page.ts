import { Component, OnInit } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';
import { Observable, map } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { Firestore, collection } from '@angular/fire/firestore';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { UserProfileService } from 'src/app/services/user-profile.service';
import { Conversation, Message, User } from 'src/app/models/model/model';
import { Team } from 'src/app/models/model/model';
import { Router } from '@angular/router';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-messaging',
  templateUrl: './messaging.page.html',
  styleUrls: ['./messaging.page.scss'],
})
export class MessagingPage implements OnInit {
  conversations: Conversation[] = []; // Array to store conversations
  newMessage: string = ''; // Initialize as an empty string to store a new message
  otherUserName?: string; // Store the name of the other user in a conversation
  messages?: Observable<Message[]>; // An Observable to store messages in a conversation

  currentUserId?: string; // Store the current user's ID
  currentConversationId?: string | null; // Store the ID of the current conversation

  users$!: Observable<User[]>; // An Observable to store a list of users

  selectedUser?: User; // Store the selected user for starting a new conversation

  groups: Team[] = [];

  constructor(
    private messageService: MessageService, // Inject the MessageService for handling messages
    private firestore: Firestore, // Inject Firestore for database operations
    private auth: AuthenticationService, // Inject AuthenticationService for user authentication
    private userProfileService: UserProfileService, // Inject UserProfileService for user profiles
    private router: Router,
    private groupService: GroupService
  ) {}

  ngOnInit() {
    this.conversations = []; // Initialize conversations array

    // Subscribe to the auth state observable
    this.auth.currentUser$.subscribe( // Listen for changes in the current user's authentication state
    user => {
      if (user) {
        // User is authenticated
        this.currentUserId = user.uid; // Store the current user's ID
        this.loadConversations(); // Load the user's conversations
      } else {
        // User is not authenticated
        console.error('User not authenticated');
       
      }
    },
    error => {
      console.error('Error in authentication:', error);
    }
  );

  this.auth.currentUser$.subscribe({
    next: (user) => {
      if (user) {
        this.groupService.getGroupsForUser(user.uid)
          .subscribe({
            next: (groups) => {
              this.groups = groups;
            },
            error: (error) => {
              console.error('Error fetching groups:', error);
            }
          });
      } else {
        console.error('User not authenticated');
      }
    },
    error: (error) => console.error(error)
  });
  
    // Get the list of all users for starting new conversations
    this.users$ = this.messageService.getUsers(); // Initialize the users Observable
  }

  async loadConversations() {
    if (!this.currentUserId) {
      console.error('Current user ID is not set');
      return;
    }

    // Load conversations for the current user
    this.messageService.getConversationsForUser(this.currentUserId)
      .subscribe((conversations) => {
        // Use safe navigation operator and provide a default value (empty array)
        this.conversations = conversations || []; // Update the conversations array
      });
  }



openGroupChat(group: Team) {
  this.router.navigate(['/chat-page', group.id]);
}


  async sendMessage(newMessageContent: string) {
    if (!newMessageContent.trim()) {
      // If the message is only whitespace, do not send it
      return;
    }

    if (this.currentConversationId) {
      // If there's an ongoing conversation, send the message
      const message: Message = {
        conversationId: this.currentConversationId,
        sender: this.currentUserId!,
        senderName: '',
        content: newMessageContent,
        timestamp: Timestamp.fromDate(new Date()),
      };

      try {
        await this.messageService.sendMessage(this.currentConversationId, message); // Send the message
      } catch (error) {
        console.error('Error sending message:', error);
      }
    } else if (!this.currentConversationId && this.selectedUser) {
      // If there's no current conversation and a user is selected, start a new one
      try {
        const newConversationId = await this.startConversationWithUser(this.selectedUser);
        if (newConversationId) {
          this.currentConversationId = newConversationId;
          this.sendMessage(newMessageContent); // Send the message after creating the conversation
        }
      } catch (error) {
        console.error('Error starting a new conversation:', error);
      }
    }
  }

  async openConversationWithUser(user: User) {
    this.selectedUser = user; // Store the selected user's data
    this.otherUserName = user.name; // Store the selected user's name for display

    const conversation = this.conversations.find(con => con.participantIds.includes(user.id));
    if (conversation) {
      // The conversation exists, proceed to open it
      this.currentConversationId = conversation.id;
      this.messages = this.messageService.getMessages(this.currentConversationId); // Load messages in the conversation
    } else {
      // The conversation doesn't exist, start a new one
      await this.startConversationWithUser(user);
    }
  }

  async startConversationWithUser(user: User): Promise<string | undefined> {
    // Ensure that currentUserId is defined
    console.log('openConversationWithUser called with user:', user);
    if (!this.currentUserId) {
      throw new Error('Current user ID is not set');
    }

    try {
      // Create a new conversation with the selected user
      const newConversationId = await this.messageService.createConversation([
        { userId: this.currentUserId, userName: 'Your Name' },
        { userId: user.id, userName: user.name },
      ]);

      if (newConversationId) {
        // Add the new conversation to the local state
        const newConversation: Conversation = {
          id: newConversationId,
          participantIds: [this.currentUserId, user.id],
          lastMessage: '',
          lastMessageTimestamp: new Date(),
          otherUserName: user.name,
        };
        this.conversations.push(newConversation); // Add the new conversation to the array
      }

      return newConversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return undefined;
    }
  }

  startConversation() {
    if (this.selectedUser) {
      // Start a conversation with the selected user
      this.openConversationWithUser(this.selectedUser);
    }
  }
}
