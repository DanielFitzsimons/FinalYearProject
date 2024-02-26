// Import necessary modules and services
import { Component, OnInit } from '@angular/core';
import { MessageService } from 'src/app/services/message.service';
import { Message } from 'src/app/models/model/model';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Timestamp } from '@angular/fire/firestore';
import { UserProfileService } from 'src/app/services/user-profile.service';

import { Observable, switchMap, map } from 'rxjs';

import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.page.html',
  styleUrls: ['./chat-page.page.scss'],
})
export class ChatPagePage implements OnInit {
  messages: Message[] = [];
  newMessageContent: string = '';
  groupId: string = ''; // Assume this is set when the chat page is opened

  currentUserId: string = ''

  isSending: boolean = false;

  constructor(
    private messageService: MessageService, 
    private authService: AuthenticationService,
    private route: ActivatedRoute,
    private userProfileService: UserProfileService
    ) {}

    ngOnInit() {
      this.route.paramMap.subscribe(params => {
        // Use the non-null assertion operator if you're sure the parameter exists
        // Or use a fallback value such as an empty string
        this.groupId = params.get('groupId')!;
        
        if (this.groupId) {
          this.loadMessages();
          this.setCurrentUserId();
        } else {
          console.error('No groupId found in route parameters.');
        }
      });
    }

  loadMessages() {
    if (this.groupId) {
      this.messageService.getGroupChatMessages(this.groupId).subscribe(messages => {
        this.messages = messages;
      });
    }
  }

  
setCurrentUserId() {
  this.authService.getCurrentUser().subscribe(user => {
    if (user) {
      this.currentUserId = user.uid;
    }
  });
}

 /* async sendMessage() {
    // Trim the newMessageContent to remove any leading/trailing whitespace
    const trimmedContent = this.newMessageContent.trim();
    console.log('Attempting to send message:', trimmedContent); // Check the trimmed message content
    
    // Check if the trimmed content is not empty
    if (trimmedContent) {
      try {
        const currentUser = await this.authService.getCurrentUser(); // Get the current user
        console.log('Current user UID:', currentUser?.uid); // Check the user UID
        
        // Ensure currentUser and currentUser.uid exist before proceeding
        if (currentUser && currentUser.uid) {
          const message: Message = {
            content: trimmedContent,
            timestamp: Timestamp.fromDate(new Date()), // Correct way to assign Timestamp
            sender: currentUser.uid, // Use the uid directly since we know it exists
            senderName: ''
          };
          
          console.log('Message object to send:', message); // Check the formed message object
          await this.messageService.sendMessageToGroupChat(this.groupId, message); // Send the message
          console.log('Message sent to group:', this.groupId); // Confirm message sending
        } else {
          console.error('The current user is not logged in or the UID is undefined.');
        }
      } catch (error) {
        console.error('Error during message sending:', error);
      } finally {
        this.newMessageContent = ''; // Clear input after sending
        this.loadMessages(); // Reload messages to include the new one
      }
    } else {
      console.log('Message content is empty or only whitespace.'); // Message content is not valid
    }
  } */


  sendMessage() {
    const trimmedContent = this.newMessageContent.trim();
  
    if (trimmedContent) {
      this.isSending = true; // Start sending, show progress bar
  
      this.authService.getCurrentUser().pipe(
        switchMap(user => {
          if (!user) {
            throw new Error('User is not logged in.');
          }
          return this.userProfileService.getUserProfile(user.uid).pipe(
            map(userProfile => {
              const message: Message = {
                content: trimmedContent,
                timestamp: Timestamp.fromDate(new Date()),
                sender: user.uid,
                senderName: userProfile.name
              };
              return message;
            })
          );
        }),
        switchMap(message => {
          return this.messageService.sendMessageToGroupChat(this.groupId, message);
        })
      ).subscribe({
        next: () => {
          this.isSending = false; // Message sent, hide progress bar
          this.newMessageContent = '';
          this.loadMessages();
        },
        error: (error) => {
          this.isSending = false; // Error occurred, hide progress bar
          console.error('Error during message sending:', error);
        }
      });
    } else {
      console.log('Message content is empty or only whitespace.');
    }
  }
  
  


  fetchUserProfile(uid: string): Observable<any> { // Replace UserProfileType with the actual type
    return this.userProfileService.getUserProfile(uid);
  }
  
  
}
