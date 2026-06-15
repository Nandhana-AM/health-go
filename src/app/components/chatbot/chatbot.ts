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

  // Drag-Resizing State
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  
  readonly chatWidth = signal<string>('380px');
  readonly chatHeight = signal<string>('520px');

  startResizing(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    
    if (this.chatScrollContainer) {
      const panel = this.chatScrollContainer.nativeElement.closest('.chat-window-panel') as HTMLElement;
      if (panel) {
        this.startWidth = panel.offsetWidth;
        this.startHeight = panel.offsetHeight;
      }
    }
    
    window.addEventListener('mousemove', this.onResizing);
    window.addEventListener('mouseup', this.stopResizing);
  }

  private onResizing = (event: MouseEvent) => {
    if (!this.isResizing) return;
    const dx = this.startX - event.clientX;
    const dy = this.startY - event.clientY;
    
    // Limits: min 320x400, max is the screen boundaries
    const newWidth = Math.max(320, Math.min(window.innerWidth - 60, this.startWidth + dx));
    const newHeight = Math.max(400, Math.min(window.innerHeight - 120, this.startHeight + dy));
    
    this.chatWidth.set(`${newWidth}px`);
    this.chatHeight.set(`${newHeight}px`);
  };

  private stopResizing = () => {
    this.isResizing = false;
    window.removeEventListener('mousemove', this.onResizing);
    window.removeEventListener('mouseup', this.stopResizing);
  };
  
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

    // 1b. Restore escaped <br> tags
    html = html.replace(/&lt;br&gt;/gi, '<br>');

    // 2. Pre-process lines to merge multi-line table rows
    const rawLines = html.split('\n');
    const lines: string[] = [];
    
    for (let i = 0; i < rawLines.length; i++) {
      const trimmedLine = rawLines[i].trim();
      
      // Check if line starts with | but doesn't end with | (optionally followed by punctuation)
      if (trimmedLine.startsWith('|') && !/\s*\|\s*[.,;]?\s*$/.test(trimmedLine)) {
        let merged = rawLines[i];
        let j = i + 1;
        while (j < rawLines.length) {
          const nextLine = rawLines[j].trim();
          merged += '<br>' + rawLines[j];
          if (/\s*\|\s*[.,;]?\s*$/.test(nextLine)) {
            i = j;
            break;
          }
          j++;
        }
        lines.push(merged);
      } else {
        lines.push(rawLines[i]);
      }
    }

    // 3. Parse Markdown Tables
    let inTable = false;
    let tableHtml = '';
    const outputLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isTableRow = line.startsWith('|') && /\s*\|\s*[.,;]?\s*$/.test(line);

      if (isTableRow) {
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
