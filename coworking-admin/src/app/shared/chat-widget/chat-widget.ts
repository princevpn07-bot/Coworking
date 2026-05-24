import { Component, ViewChild, ElementRef, AfterViewChecked, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiService, ChatMessage } from '../../services/ai';

@Component({
  selector: 'app-chat-widget',
  imports: [FormsModule],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css'
})
export class ChatWidget implements AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  isOpen = signal(false);
  isLoading = signal(false);
  userInput = '';
  messages: ChatMessage[] = [
    { role: 'assistant', content: '你好！我是 CoWork 的 AI 助理，有任何關於空間預約或平台功能的問題都可以問我！' }
  ];

  constructor(private aiService: AiService) {}

  ngAfterViewChecked() {
    if (this.messageContainer) {
      const el = this.messageContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  toggle() {
    this.isOpen.update(v => !v);
  }

  send() {
    const prompt = this.userInput.trim();
    if (!prompt || this.isLoading()) return;

    this.messages.push({ role: 'user', content: prompt });
    this.userInput = '';
    this.isLoading.set(true);

    const history = this.messages.slice(0, -1);

    this.aiService.ask(prompt, history).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', content: res.reply });
        this.isLoading.set(false);
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: '抱歉，目前無法回應，請稍後再試。' });
        this.isLoading.set(false);
      }
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
