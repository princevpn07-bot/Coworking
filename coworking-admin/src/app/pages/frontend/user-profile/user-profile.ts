import { Component, Input, Output, EventEmitter, HostListener , OnInit, ChangeDetectorRef} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../../services/profile';

export interface UserProfileData {
  firstName: string;
  lastName: string;
  bio: string;
  email: string;
  phone: string;
  address: string;
  lineId: string;
  companyName: string;
  jobTitle: string;
  industry: string;
  passwordLastUpdated: string;
  twoFactorEnabled: boolean;
  avatarUrl: string;
}

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile implements OnInit {
 @Input() profile: UserProfileData = {
    firstName: '',
    lastName: '',
    bio: '',
    email: '',
    phone: '',
    address: '',
    lineId: '',
    companyName: '',
    jobTitle: '',
    industry: '建築與設計',
    passwordLastUpdated: '3 個月前',
    twoFactorEnabled: false,
    avatarUrl: 'https://lh3.googleusercontent.com/media/...'
  };

  @Output() saveProfile = new EventEmitter<UserProfileData>();
  @Output() cancelChange = new EventEmitter<void>();
  @Output() avatarRequest = new EventEmitter<void>();
// 🌟 宣告兩個用來鎖定滾動的變數（加在 activeSection = 'basic'; 下方即可）
private isProgrammaticScroll = false;
private scrollTimeout: any;

activeSection = 'basic';
showSuccessToast = false; // 預設隱藏
isEditMode = false;// 🌟 1. 新增一個控制表單編輯狀態的開關（預設為可編輯 true）
originalProfile: any;
isDropdownOpen = false;
rawImageBase64: string = ''; // 存放未裁切的原始大頭貼
avatarScale: number = 100;     // 🌟 新增：縮放比例 (100% ~ 300%)
avatarPositionX: number = 50;  // 🌟 新增：左右位置 (0 ~ 100)
avatarPositionY: number = 50; // 滑桿數值 (0 ~ 100)，預設 50 代表置中
isImageLoading = false;        // 🌟 新增：控制頭貼是否正在讀取中

private decodedImage: HTMLImageElement | null = null; // 🌟 新增：快取已解碼的圖片實體

constructor(
  private profileService: ProfileService,
  private cdr: ChangeDetectorRef
) {}

// 切換選單顯示狀態
toggleDropdown(): void {
  this.isDropdownOpen = !this.isDropdownOpen;
}
// 選擇選項後，關閉選單並更新資料
selectOption(option: string): void {
  this.profile.industry = option;
  this.isDropdownOpen = false;
}

// (選做) 點擊選單外部時關閉 (防止選單一直開著)
@HostListener('document:click', ['$event'])
onDocumentClick(event: Event): void {
  const target = event.target as HTMLElement;
  if (!target.closest('.custom-select-box')) {
    this.isDropdownOpen = false;
  }
}

  ngOnInit(): void {
    this.profileService.getProfile().subscribe({
      next: (data: any) => {
        // 映射後端傳回的各個 DTO 欄位到前端畫面上
        this.profile.email = data.email || '';
        this.profile.phone = data.phone || '';
        this.profile.lineId = data.lineId || '';
        this.profile.address = data.address || '';
        this.profile.bio = data.bio || '';
        this.profile.companyName = data.companyName || '';
        this.profile.jobTitle = data.jobTitle || '';
        this.profile.industry = data.industry || '建築與設計';
        this.profile.twoFactorEnabled = data.twoFactorEnabled || false;
        if (data.image) {
          this.profile.avatarUrl = data.image; // 載入資料庫內存的大頭貼

        }
        // 🌟 核心轉換：將後端的單一 Name 拆解回前端的「姓」與「名」
        const fullName = data.name || '';
        if (fullName.length >= 2) {
          this.profile.lastName = fullName.substring(0, 1);  // 拿第一個字當姓
          this.profile.firstName = fullName.substring(1);    // 剩下的字當名字
        } else {
          this.profile.firstName = fullName;
          this.profile.lastName = '';
        }
        this.originalProfile = { ...this.profile }; // 儲存原始資料快照
         this.profileService.updateAvatarStream(this.profile.avatarUrl);
        console.log('SQL 資料庫讀取成功，已同步至畫面！');
        this.cdr.markForCheck(); // 手動標記元件需要檢查，確保畫面更新
      },
      error: (err) => {
        console.error('資料讀取失敗，請確認是否已登入取得驗證 Token', err);
      }
    });
  }

  // 🌟 3. 點擊「儲存變更」時的送出邏輯
  onSubmit(): void {
    // 🌟 核心轉換：將前端分開的姓氏與名字重新合體
    const combinedName = `${this.profile.lastName}${this.profile.firstName}`;

    // 包裝成符合後端 AdminUserProfileDto 規格的 JSON 物件
    const dtoData = {
      name: combinedName,
      email: this.profile.email,
      phone: this.profile.phone,
      lineId: this.profile.lineId,
      address: this.profile.address,
      image: this.profile.avatarUrl,
      bio: this.profile.bio,
      companyName: this.profile.companyName,
      jobTitle: this.profile.jobTitle,
      industry: this.profile.industry,
      twoFactorEnabled: this.profile.twoFactorEnabled
    };

    // 呼叫 Service 發送 PUT 請求給後端
    this.profileService.updateProfile(dtoData).subscribe({
      next: () => {
        // 🚀 改用精美的浮動 Toast 動畫
      this.showSuccessToast = true;

    // 儲存成功後，將編輯模式關閉！
      this.isEditMode = false;
      this.originalProfile = { ...this.profile };
      this.profileService.updateAvatarStream(this.profile.avatarUrl);
        this.saveProfile.emit(this.profile);
      },
      error: (err) => {
        alert('儲存失敗，請檢查後端 API 連線或登入狀態。');
        console.error('API 更新錯誤：', err);
      }
    });
  }

enterEditMode(): void {
  this.isEditMode = true;
}

// 🌟 優化後的點擊滾動方法
scrollToSection(sectionId: string, event: Event): void {
  event.preventDefault();

  // 點擊時，先清除可能殘留的計時器
  if (this.scrollTimeout) {
    clearTimeout(this.scrollTimeout);
  }

  // 1. 啟用鎖定：告訴系統現在是點擊觸發的滾動
  this.isProgrammaticScroll = true;
  this.activeSection = sectionId; // 立即把高亮定格在目標上，不讓它亂跳

  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 2. 當平滑滾動大約完成後（通常 500-600ms），自動解鎖讓手動滾動功能恢復
  this.scrollTimeout = setTimeout(() => {
    this.isProgrammaticScroll = false;
  }, 600);
}
  // 🌟 新增：監聽網頁滾動事件（ScrollSpy），當滑鼠往下滾動時，左側選單會跟著右邊內容自動變色
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (this.isProgrammaticScroll) return;
    const sections = ['basic', 'contact', 'professional', 'security'];
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    // 設定滾動判斷的 offset 緩衝值（對齊頂端 Navbar 80px + 額外間距）
    const offsetThreshold = 140;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const topOfSection = element.offsetTop - offsetThreshold;
        const bottomOfSection = topOfSection + element.offsetHeight;

        if (scrollPosition >= topOfSection && scrollPosition < bottomOfSection) {
          this.activeSection = section;
          break;
        }
      }
    }
  }

  onAvatarClick(): void { this.avatarRequest.emit(); }
 // 🌟 重新設計取消邏輯

 // 🌟 新增此方法，用來處理使用者選好圖片後的「即時預覽」
onFileSelected(event: any): void {
  const file = event.target.files[0]; // 取得使用者選取的第一張圖片

  if (file) {
    // 安全檢查：限制檔案大小（例如不得超過 2MB，可選）
    if (file.size > 2 * 1024 * 1024) {
      alert('圖片大小不能超過 2MB！');
      return;
    }
    this.isImageLoading = true; // 🌟 啟動讀取中遮罩
    const reader = new FileReader();
    // 當圖片讀取完成後，觸發此回調
    reader.onload = () => {
      // 🌟 記錄下未裁切的原始圖片，並初始化滑桿為 50
      this.rawImageBase64 = reader.result as string;
      this.avatarScale = 100;     // 預設不放大
      this.avatarPositionX = 50;  // 預設左右置中
      this.avatarPositionY = 50;


      // 🌟 優化：在記憶體中預先建立並解碼圖片，且只做這一次！
      const img = new Image();
      img.src = this.rawImageBase64;
     img.onload = () => {
      this.decodedImage = img;     // 將解碼完的實體快取起來
     this.bakeCroppedImage();     // 執行第一次渲染
        this.isImageLoading = false; // 🌟 解碼完成，關閉讀取中遮罩
      this.profile.avatarUrl = reader.result as string;
      this.profileService.updateAvatarStream(this.profile.avatarUrl);
      console.log('大頭貼預覽已更新（尚未儲存）');
    };
  };
    // 開始將圖片檔案讀取為 DataURL (Base64)
    reader.readAsDataURL(file);
  }
}
// 🌟 3. 新增核心核心核心方法：利用 Canvas 進行像素級位置裁切
bakeCroppedImage(): void {
if (!this.decodedImage) return;
  const img = this.decodedImage;



    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const size = 400; // 強制輸出高畫質 400x400 正方形頭像
    canvas.width = size;
    canvas.height = size;

    if (ctx) {
      // 🟢 核心演算 1：找出照片的短邊，作為 100% 縮放時的基礎正方形大小
      const baseSize = Math.min(img.width, img.height);

      // 🟢 核心演算 2：根據放大比例（100% ~ 300%），等比例縮減原圖裁切框的大小
      const currentZoom = this.avatarScale / 100;
      const sSize = baseSize / currentZoom;

      // 🟢 核心演算 3：動態計算此時在原圖上，X 軸與 Y 軸容許移動的最大安全邊界
      const maxX = img.width - sSize;
      const maxY = img.height - sSize;

      // 🟢 核心演算 4：將滑桿的 0~100 百分比，精準映射到原圖的像素起點座標 (sx, sy)
      const sx = (this.avatarPositionX / 100) * maxX;
      const sy = (this.avatarPositionY / 100) * maxY;

      // 🟢 核心實體繪製
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, size, size);

      // 輸出並廣播
      this.profile.avatarUrl = canvas.toDataURL('image/jpeg', 0.9);
      this.profileService.updateAvatarStream(this.profile.avatarUrl);
    }
}

onCancel(): void {
  // 1. 重新呼叫一次 API 撈取原始資料，達成「取消修改」的效果
  this.profileService.getProfile().subscribe({
    next: (data) => {
      // 這裡直接填入跟 ngOnInit 一樣的轉換邏輯，確保資料變回原始狀態
    this.profile = { ...this.originalProfile };
      // ... (這裡可以複製 ngOnInit 裡面的所有屬性賦值)

    this.profileService.updateAvatarStream(this.profile.avatarUrl);

      // 2. 恢復原始資料後，關閉編輯模式
      this.isEditMode = false;
      console.log('編輯已取消，資料已復原');
    },
    error: (err) => {
      console.error('復原資料失敗', err);
    }
  });
}
  //onSubmit(): void { this.saveProfile.emit(this.profile); }
}
