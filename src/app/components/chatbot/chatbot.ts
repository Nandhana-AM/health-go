import { Component, ElementRef, ViewChild, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../services/product.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent {
  private readonly chatbotService = inject(ChatbotService);
  private readonly cartService = inject(CartService);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;

  // Toggle State
  readonly isOpen = signal<boolean>(false);
  
  // Message Log
  readonly messages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Vanakkam! Welcome to Health Go! 🌿\n\nI am Go-Bot, your virtual wellness assistant. Ask me anything about our organic products, ingredients, health benefits, or shipping rates.',
      timestamp: new Date(),
      suggestions: [
        'Tell me about Karupatti',
        'What are the benefits of Garlic?',
        'Do you have filter coffee?',
        'What are the delivery charges?'
      ]
    }
  ]);

  // Input bindings
  readonly userMessage = signal<string>('');
  readonly isTyping = signal<boolean>(false);

  toggleChat(): void {
    this.isOpen.update(open => !open);
    if (this.isOpen()) {
      // Small timeout to allow render before scroll
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  async sendMessage(textToSend: string): Promise<void> {
    const query = textToSend.trim();
    if (!query || this.isTyping()) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: query,
      timestamp: new Date()
    };
    this.messages.update(curr => [...curr, userMsg]);
    this.userMessage.set('');
    
    // Scroll down
    setTimeout(() => this.scrollToBottom(), 50);

    // 2. Set Typing State
    this.isTyping.set(true);
    setTimeout(() => this.scrollToBottom(), 50);

    // 3. Fetch Bot Reply
    try {
      const botMsg = await this.chatbotService.getResponse(query);
      this.messages.update(curr => [...curr, botMsg]);
    } catch (e) {
      console.error('Chatbot failed to reply', e);
    } finally {
      this.isTyping.set(false);
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  clickSuggestion(suggestion: string): void {
    this.sendMessage(suggestion);
  }

  // Quick Action inside bot's product card
  addToCart(product: Product): void {
    this.cartService.addToCart(product);
  }

  formatMessage(text: string): SafeHtml {
    if (!text) return '';

    let html = text;

    // 1. Escape basic HTML tags to prevent XSS
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Parse Markdown Tables
    const lines = html.split('\n');
    let inTable = false;
    let tableHtml = '';
    const outputLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        // Skip separator line (e.g. |---|---|)
        if (line.includes('---') || line.includes('===') || line.replace(/[|\s-]/g, '') === '') {
          if (!inTable) {
            inTable = true;
          }
          continue;
        }

        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (!inTable) {
          inTable = true;
          tableHtml = '<div class="table-responsive"><table class="chat-table"><thead><tr>';
          cells.forEach(cell => {
            tableHtml += `<th>${this.parseInlineMarkdown(cell)}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
        } else {
          tableHtml += '<tr>';
          cells.forEach(cell => {
            tableHtml += `<td>${this.parseInlineMarkdown(cell)}</td>`;
          });
          tableHtml += '</tr>';
        }
      } else {
        if (inTable) {
          tableHtml += '</tbody></table></div>';
          outputLines.push(tableHtml);
          tableHtml = '';
          inTable = false;
        }
        outputLines.push(line);
      }
    }
    if (inTable) {
      tableHtml += '</tbody></table></div>';
      outputLines.push(tableHtml);
    }

    html = outputLines.join('\n');
    html = this.parseInlineMarkdown(html);

    // Replace newlines with <br> (but skip formatting newlines inside table markup)
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<table([\s\S]*?)<\/table>/g, (match) => {
      return match.replace(/<br>/g, '');
    });

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private parseInlineMarkdown(text: string): string {
    return text
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italics *text*
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Bullet points - or • or * at start of string or after a newline/br
      .replace(/(?:^|<br>)\s*[-•*]\s+(.*?)(?=<br>|$)/gi, (match, content) => {
        return `<br><span class="bullet-item">🌿 ${content}</span>`;
      });
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        const element = this.chatScrollContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.warn('Scroll failed', err);
    }
  }
}
