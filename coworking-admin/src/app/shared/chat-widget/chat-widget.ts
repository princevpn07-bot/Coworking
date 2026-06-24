import { Component, ViewChild, ElementRef, AfterViewChecked, signal,effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService, AIAction, ChatMessage } from '../../services/ai';
import { DatePipe } from '@angular/common';
import { LottieComponent, AnimationOptions } from 'ngx-lottie'


@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [FormsModule, LottieComponent, DatePipe],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.css',
})
export class ChatWidget implements AfterViewChecked {
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  today = new Date(); // show current date on ai-chat bot
  isOpen = signal(false);
  isLoading = signal(false);
  isTyping = signal(false); // 💡 新增：獨立控制目前是否正在逐字打字吐字中

// 🌟 1. 全新新增：提示對話框狀態、文字與隨機語句庫
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
  messages: ChatMessage[] = [
    { role: 'assistant', content: '你好！我是 CoWork 的 AI 助理，有任何關於空間預約或平台功能的問題都可以問我！' }
  ];

  // 💡 1. 新增：控制表情面板顯示狀態的 Signal 與精選表情清單
  showEmojiPicker = signal(false);
  emojis = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😭', '😮', '👍', '👏', '🙌', '🔥', '❤️', '✨'];

catOptions: AnimationOptions = {
    path: '/assets/json/Live chatbot.json',
    loop: true,
    autoplay: true,
  };

  // 用來控制動畫實例
  private animationItem: any;

  // 💡 2. 新增：點擊笑臉時切換面板開關
  toggleEmojiPicker() {
    this.showEmojiPicker.update(v => !v);
  }
// 💡 3. 新增：點擊表情符號時，直接加進輸入框文字中
  addEmoji(emoji: string) {
    this.userInput += emoji;
  }
  onAnimationCreated(animationItem: any) {
    this.animationItem = animationItem;
    // 💡 2. 初始化成功後，預設進入待機狀態：速度放慢、只循環第 40~70 影格的眨眼動態

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
      // 寫法一（推薦，最乾淨）：直接讓貓咪回到第 0 影格（最乖的預設姿勢）並靜止
      this.animationItem.setSpeed(0.3);
      this.animationItem.playSegments([40, 70], true);
    }
  }

  //
  constructor(private aiService: AiService, private router: Router) {
// 💡 只有在 constructor 裡面新增這段動態監聽，不影響其他 function
    effect(() => {
      const loading = this.isLoading();
      const typing = this.isTyping();

      if (this.animationItem) {
        if (loading || typing) {
          // 無論是 AI 還在動腦，還是正在輸出答案，貓咪都呈現忙碌狀態（2.0倍速，播全套手舞足蹈）
          this.animationItem.setSpeed(2.0);
          this.animationItem.playSegments([0, 85], true);
        } else {
          // 當不思考也不打字時，秒切回極簡溫潤的待機眨眼
          this.animationItem.setSpeed(0.6);
          this.animationItem.playSegments([40, 70], true);
      }

      }
    });
     // 🌟 2. 全新新增：啟動隨機對話定時器（每 10 秒更換一次，完美對齊 CSS 隱形週期）
    this.hintTimer = setInterval(() => {
      if (!this.isOpen() && this.isHintVisible()) {
        const randomIndex = Math.floor(Math.random() * this.hintPhrases.length);
        this.hintText.set(this.hintPhrases[randomIndex]);
      }
    }, 3000);
  }
// 🌟 3. 全新新增：關閉提示對話框的專屬函式
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

  toggle() {
    this.isOpen.update(v => !v);
  }
// 💡 全新外掛的打字機絲滑吐字函式（100% 安全，完全不破壞既有架構）
  typewriteMessage(fullText: string, onComplete?: () => void) {
    this.isTyping.set(true);

    // 先在陣列結尾塞入一個「初始為空字串」的助理對話泡泡
    this.messages.push({ role: 'assistant', content: '' });
    const targetIndex = this.messages.length - 1;

    let charIndex = 0;
    const timer = setInterval(() => {
      if (charIndex < fullText.length) {
        // 逐字追加字元
        this.messages[targetIndex].content += fullText.charAt(charIndex);
        charIndex++;
      } else {
        // 字元全部吐完，清除定時器
        clearInterval(timer);
        this.isTyping.set(false); // 變更訊號，自動將貓咪切回待機眨眼

        // 執行吐字完成後的後續動作 (如：空間過濾的路由跳轉)
        if (onComplete) onComplete();
      }
    }, 30); // 💡 每 30 毫秒吐一個字，這個速度在網頁體驗上最舒適流暢、不拖泥帶水
  }
  send() {
    const prompt = this.userInput.trim();
    if (!prompt || this.isLoading()) return;

    this.messages.push({ role: 'user', content: prompt });
    this.userInput = '';
    this.isLoading.set(true);
    // 💡 5. 微調：按送出或 Enter 時，自動把表情面板收起來
    this.showEmojiPicker.set(false);

    const history = this.messages.slice(0, -1);

    this.aiService.ask(prompt, history).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // 💡 2. 呼叫外掛打字機函式，並把原本的路由跳轉功能包裹成回呼函式（onComplete）傳入
        this.typewriteMessage(res.reply, () => {
        if (res.action?.type === 'filter_spaces') {
          setTimeout(() => this.navigateToSpaces(res.action!), 1200);
        }
        });
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: '抱歉，目前無法回應，請稍後再試。' });
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
    this.toggle();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
}
