

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCommentDots, faRobot } from '@fortawesome/free-solid-svg-icons';
import { ChatService } from '../services/chatbot/chat.service';
interface Message {
  from: 'user' | 'bot';
  text: string;
  loading?: boolean;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule , FontAwesomeModule
  ]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  userMessage: string = '';
  messages: Message[] = [];
isOpen = false;
isExpanded = false;
faRobot = faRobot ;
faCommentDots = faCommentDots;

 // Toggles chat window visibility
toggleChat() {
  this.isOpen = !this.isOpen;

}

 // Scrolls to bottom of chat after view changes
 ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

   // Initializes component with welcome message
 ngOnInit() {
    this.messages.push({ 
      from: 'bot', 
      text: 'Salut ! Comment puis-je t\'\aider aujourd\'\hui ?' 
    });
  }

// Toggles chat window expansion
toggleExpand() {
  this.isExpanded = !this.isExpanded;
}


  constructor(private chatService: ChatService) {}

  // Handles sending user messages and receiving bot responses
  sendMessage() {
    const question = this.userMessage.trim();
    if (!question) return;

    // Add user message
    this.messages.push({ from: 'user', text: question });

    // Add bot loading indicator
    const loadingMsg: Message = { from: 'bot', text: '', loading: true };
    this.messages.push(loadingMsg);


    this.chatService.askBot(question).subscribe({
      next: (response) => {
        // Remove loading indicator
        this.messages.pop();
        // Add actual bot response
        this.messages.push({ from: 'bot', text: response });
      },
      error: () => {
        this.messages.pop();
        this.messages.push({ from: 'bot', text: "Erreur lors de la communication avec le bot." });
      }
    });


   // Clear input field
    this.userMessage = '';
  }



}
