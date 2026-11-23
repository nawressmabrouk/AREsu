import { Component } from '@angular/core';
import { PageHeaderComponent } from '../shared/ui/page-header.component';
import { ChatComponent } from './chatbot.component';

/** /chatbot: the assistant as a full page (the floating button is hidden here). */
@Component({
  selector: 'app-assistant-page',
  imports: [ChatComponent, PageHeaderComponent],
  template: `
    <div class="page narrow">
      <app-page-header eyebrow="Aide" title="Assistant de réservation"
        subtitle="Posez vos questions sur la réservation des espaces : démarches, disponibilités, annulation…" />
      <app-chat [inline]="true" />
    </div>
  `,
  styles: `.narrow { max-width: 820px; }`,
})
export class AssistantPageComponent {}
