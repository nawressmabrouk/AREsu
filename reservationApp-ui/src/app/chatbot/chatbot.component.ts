

import { Component , OnInit , ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService } from '../services/chatbot/chat.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRobot , faCommentDots} from '@fortawesome/free-solid-svg-icons';
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
toggleChat() {
  this.isOpen = !this.isOpen;
  // Simplifié, ça marche pareil
}
 ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

 ngOnInit() {
    // Ajouter le message de bienvenue quand le composant est initialisé
    this.messages.push({ 
      from: 'bot', 
      text: 'Salut ! Comment puis-je t\'\aider aujourd\'\hui ?' 
    });
  }


toggleExpand() {
  this.isExpanded = !this.isExpanded;
}


  constructor(private chatService: ChatService) {}

  sendMessage() {
    const question = this.userMessage.trim();
    if (!question) return;

    // Ajoute le message utilisateur
    this.messages.push({ from: 'user', text: question });

    // Ajoute une bulle de chargement du bot
    const loadingMsg: Message = { from: 'bot', text: '', loading: true };
    this.messages.push(loadingMsg);

    this.chatService.askBot(question).subscribe({
      next: (response) => {
        // Retire la bulle de chargement
        this.messages.pop();
        // Ajoute la réponse réelle
        this.messages.push({ from: 'bot', text: response });
      },
      error: () => {
        this.messages.pop();
        this.messages.push({ from: 'bot', text: "Erreur lors de la communication avec le bot." });
      }
    });


    // Vide le champ utilisateur
    this.userMessage = '';
  }



}
