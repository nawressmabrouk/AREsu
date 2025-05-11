import { Component, OnDestroy } from '@angular/core';
import { ChatService } from '../services/chatbot/chat.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule] // Add both modules here
})

export class ChatbotComponent implements OnDestroy {
  userMessage = '';
  userId = 'user123'; // Get this from your auth system
  messages: { from: 'user' | 'bot', text: string, loading?: boolean }[] = [];
  private subscription?: Subscription;

  constructor(private chatService: ChatService) {}

  sendMessage() {
    if (!this.userMessage.trim()) return;

    // Add user message
    this.messages.push({ 
      from: 'user', 
      text: this.userMessage 
    });

    // Add temporary bot message
    const botMessageIndex = this.messages.push({ 
      from: 'bot', 
      text: '',
      loading: true
    }) - 1;

    this.subscription = this.chatService
      .streamChat(this.userMessage, this.userId)
      .subscribe({
        next: (chunk) => {
          this.messages[botMessageIndex].text += chunk;
        },
        error: (error) => {
          this.messages[botMessageIndex].text = 'Error: ' + error.message;
          this.messages[botMessageIndex].loading = false;
        },
        complete: () => {
          this.messages[botMessageIndex].loading = false;
        }
      });

    this.userMessage = '';
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}