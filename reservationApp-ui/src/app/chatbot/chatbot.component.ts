import { AfterViewChecked, Component, DestroyRef, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ChatService } from '../services/chatbot/chat.service';

interface Message {
  from: 'user' | 'bot';
  text: string;
  loading?: boolean;
}

/**
 * "Spacey", the assistant. Floating button + chat panel (placed once in each layout),
 * or an inline panel when [inline]="true" (the /chatbot page).
 */
@Component({
  selector: 'app-chat',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  standalone: true,
  imports: [FormsModule, MatIconButton, MatIcon, MatTooltip],
  host: { '[class.inline]': 'inline', '[class.hidden]': 'hiddenOnThisPage' }
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('input') private input?: ElementRef<HTMLInputElement>;

  /** Render as a page section instead of a floating widget. */
  @Input() inline = false;

  private readonly chatService = inject(ChatService);
  private readonly router = inject(Router);

  userMessage = '';
  messages: Message[] = [];
  isOpen = false;
  isExpanded = false;
  hiddenOnThisPage = false;
  private shouldScroll = false;

  readonly suggestions = [
    'Comment réserver une salle ?',
    'Comment annuler une réservation ?',
    'Comment consulter les disponibilités ?',
  ];

  constructor() {
    // The floating launcher is not needed on the assistant page itself
    this.updateVisibility();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => this.updateVisibility());
  }

  ngOnInit() {
    if (this.inline) {
      this.isOpen = true;
    }
    this.messages.push({
      from: 'bot',
      text: 'Bonjour ! Je suis Spacey, l\'assistant de réservation. Comment puis-je vous aider aujourd\'hui ?'
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  get hasConversation(): boolean {
    return this.messages.some(m => m.from === 'user');
  }

  get waiting(): boolean {
    return this.messages.some(m => m.loading);
  }

  // Toggles chat window visibility
  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
      setTimeout(() => this.input?.nativeElement.focus(), 50);
    }
  }

  // Toggles chat window expansion
  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  ask(question: string) {
    this.userMessage = question;
    this.sendMessage();
  }

  // Handles sending user messages and receiving bot responses
  sendMessage() {
    const question = this.userMessage.trim();
    if (!question || this.waiting) return;

    this.messages.push({ from: 'user', text: question });
    const loadingMsg: Message = { from: 'bot', text: '', loading: true };
    this.messages.push(loadingMsg);
    this.shouldScroll = true;
    this.userMessage = '';

    this.chatService.askBot(question).subscribe({
      next: (response) => {
        this.messages = this.messages.filter(m => m !== loadingMsg);
        this.messages.push({ from: 'bot', text: response });
        this.shouldScroll = true;
      },
      error: () => {
        this.messages = this.messages.filter(m => m !== loadingMsg);
        this.messages.push({ from: 'bot', text: 'Erreur lors de la communication avec l\'assistant. Veuillez réessayer.' });
        this.shouldScroll = true;
      }
    });
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer?.nativeElement;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }

  private updateVisibility(): void {
    this.hiddenOnThisPage = !this.inline && this.router.url.split('?')[0] === '/chatbot';
  }
}
