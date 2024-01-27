import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Message } from 'src/app/models/model/model';

@Component({
  selector: 'app-messaging-interface',
  templateUrl: './messaging-interface.component.html',
  styleUrls: ['./messaging-interface.component.scss'],
})
export class MessagingInterfaceComponent {
  @Input() messages!: Message[] | null;
  @Input() currentUserId?: string;
  @Output() messageSend = new EventEmitter<string>();

  newMessage: string = '';

  constructor() {}

  send() {
    if (this.newMessage.trim()) {
      this.messageSend.emit(this.newMessage); // Emit the message content to the parent component
      this.newMessage = ''; // Clear the input field
    }
  }
}
