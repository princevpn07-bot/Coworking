import { Component, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService, AIAction, ChatMessage } from '../../services/ai';
import { DatePipe } from '@angular/common';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [FormsModule, LottieComponent, DatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidget implements AfterViewChecked, OnInit, OnDestroy {
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  today = new Date(); // show current date on ai-chat bot
  isOpen = signal(false);
  isLoading = signal(false);
  isTyping = signal(false); // 💡 獨立控制目前是否正在逐字打字吐字中

  // 🌟 提示對話框狀態、文字與隨機語句庫
  hintText = signal('點我！✨');
  isHintVisible = signal(true);
  private hintPhrases = [
    '點我！✨',
    '有問題問我喔！🐾',
    '找預約空間嗎？🏢',
    '想找熱門座位？🔥',
    '嗨！找我聊聊吧～🐱',
    '今天想去哪裡工作？☕'
  ];
  private hintTimer: any;

  userInput = '';
  messages = signal<ChatMessage[]>([
    { role: 'assistant', content: '你好！我是 COVO 的 AI 助理，有任何關於空間預約或平台功能的問題都可以問我！' }
  ]);

  // 💡 控制表情面板顯示狀態的 Signal 與精選表情清單
  showEmojiPicker = signal(false);
  emojis = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😭', '😮', '👍', '👏', '🙌', '🔥', '❤️', '✨'];

  catOptions: AnimationOptions = {
    path: '/assets/json/Live chatbot.json',
    loop: true,
    autoplay: true,
  };

  // 用來控制動畫實例
  private animationItem: any;

  // 💡 點擊笑臉時切換面板開關
  toggleEmojiPicker() {
    this.showEmojiPicker.update(v => !v);
  }

  // 💡 點擊表情符號時，直接加進輸入框文字中
  addEmoji(emoji: string) {
    this.userInput += emoji;
  }

  onAnimationCreated(animationItem: any) {
    this.animationItem = animationItem;
  }

  // 💡 滑鼠移入：變超快
  onHover() {
    if (this.animationItem && !this.isLoading() && !this.isTyping()) {
      this.animationItem.setSpeed(1.0);
      this.animationItem.playSegments([0, 85], true);
    }
  }

  // 💡 滑鼠移出：控制貓咪停下來，或切換到特定平靜姿勢
  onLeave() {
    if (this.animationItem && !this.isLoading() && !this.isTyping()) {
      this.animationItem.setSpeed(0.3);
      this.animationItem.playSegments([40, 70], true);
    }
  }

  constructor(private aiService: AiService, private router: Router) {
    effect(() => {
      const loading = this.isLoading();
      const typing = this.isTyping();

      if (this.animationItem) {
        if (loading || typing) {
          this.animationItem.setSpeed(2.0);
          this.animationItem.playSegments([0, 85], true);
        } else {
          this.animationItem.setSpeed(0.6);
          this.animationItem.playSegments([40, 70], true);
        }
      }
    });

    // 🌟 啟動隨機對話定時器（每 3 秒更換一次）
    this.hintTimer = setInterval(() => {
      if (!this.isOpen() && this.isHintVisible()) {
        const randomIndex = Math.floor(Math.random() * this.hintPhrases.length);
        this.hintText.set(this.hintPhrases[randomIndex]);
      }
    }, 3000);
  }

  // 🌟 關閉提示對話框的專屬函式
  closeHint(event: MouseEvent) {
    event.stopPropagation(); // 💡 超關鍵：阻止事件向上冒泡，才不會意外把聊天視窗打開！
    this.isHintVisible.set(false);
    if (this.hintTimer) {
      clearInterval(this.hintTimer); // 關閉後清除定時器，釋放效能
    }
  }

  ngAfterViewChecked() {
    if (this.messageContainer) {
      const el = this.messageContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  ngOnInit() {
    // 💡 已移除舊有的白色對話框初始化邏輯
  }

  ngOnDestroy() {
    // 💡 確保組件銷毀時清除隨機對話計時器，防記憶體洩漏
    if (this.hintTimer) {
      clearInterval(this.hintTimer);
    }
  }

  toggle() {
    this.isOpen.update(v => !v);
  }

  // 💡 外掛的打字機絲滑吐字函式
  typewriteMessage(fullText: string, onComplete?: () => void) {
    this.isTyping.set(true);
    this.messages.update(m => [...m, { role: 'assistant', content: '' }]);
    const targetIndex = this.messages().length - 1;

    let charIndex = 0;
    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        const char = fullText.charAt(charIndex);
        this.messages.update(m => {
          const next = [...m];
          next[targetIndex] = { ...next[targetIndex], content: next[targetIndex].content + char };
          return next;
        });
        charIndex++;
      } else {
        clearInterval(timer);
        this.isTyping.set(false);
        if (onComplete) onComplete();
      }
    }, 30);
  }

  send() {
    const prompt = this.userInput.trim();
    if (!prompt || this.isLoading()) return;

    this.messages.update(m => [...m, { role: 'user', content: prompt }]);
    this.userInput = '';
    this.isLoading.set(true);
    this.showEmojiPicker.set(false);

    const history = this.messages().slice(0, -1);

    this.aiService.ask(prompt, history).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.typewriteMessage(res.reply, () => {
          if (res.action?.type === 'filter_spaces') {
            setTimeout(() => this.navigateToSpaces(res.action!), 1200);
          }
        });
      },
      error: () => {
        this.messages.update(m => [...m, { role: 'assistant', content: '抱歉，目前無法回應，請稍後再試。' }]);
        this.isLoading.set(false);
      }
    });
  }

  navigateToSpaces(action: AIAction) {
    const params: Record<string, string> = {};
    if (action.params.minPrice != null) params['minPrice'] = String(action.params.minPrice);
    if (action.params.maxPrice != null) params['maxPrice'] = String(action.params.maxPrice);
    if (action.params.capacity != null) params['capacity'] = String(action.params.capacity);
    if (action.params.city) params['city'] = action.params.city;
    if (action.params.keyword) params['keyword'] = action.params.keyword;
    this.router.navigate(['/all-spaces'], { queryParams: params });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
