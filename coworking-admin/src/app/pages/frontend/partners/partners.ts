import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './partners.html',
  styleUrl: './partners.css',
})
export class Partners implements OnInit {
  partnerForm!: FormGroup;
  submissionsCount = 0;

  // 核心價值資料集：嚴格對照與圖片完全吻合
  advantages = [
    {
      icon: 'group',
      title: '精準客群引流',
      desc: '平台匯聚大量遠端工作者與新創團隊，上架即自帶流量。'
    },
    {
      icon: 'dashboard',
      title: '智慧空間管理',
      desc: '提供直覺的後台管理系統，預約狀況、租金收益一目了然。'
    },
    {
      icon: 'visibility',
      title: '多元視覺展示',
      desc: '支援全方位空間導覽與高畫質影像呈現，完美還原空間質感。'
    }
  ];

  // 合作流程步驟集
  steps = [
    { step: '01', title: '1. 線上提案', desc: '填寫下方表單，上傳您的空間基礎資訊與照片，即可輕鬆啟動合作提案。' },
    { step: '02', title: '2. 專人審核', desc: '我們的專業運營團隊將於 1-3 個工作天內，進行資料核對與專利的 LINE 自動化審核對接。' },
    { step: '03', title: '3. 正式上線', desc: '審核通過後，您的空間將立即展示於 WorkspaceCollective 平台上，向全球租客開啟預訂。' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // 建立響應式表單防呆機制
    this.partnerForm = this.fb.group({
      contactName: ['', Validators.required],
      contactPhone: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]], 
      contactEmail: ['', [Validators.required, Validators.email]],
      spaceName: ['', Validators.required],
      spaceType: ['', Validators.required],
      spaceAddress: ['', Validators.required],
      capacity: ['', [Validators.required, Validators.min(1)]],
      spaceSize: ['', [Validators.required, Validators.min(1)]]
    });
  }

  // 錨點流暢平滑滾動
  scrollToForm(): void {
    const formElement = document.getElementById('application-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 表單安全提交
  onSubmit(): void {
    if (this.partnerForm.valid) {
      console.log('表單提交成功', this.partnerForm.value);
      this.submissionsCount++;
      alert('您的空間夥伴申請已成功提交！我們的專員將於 1-3 個工作天內與您聯繫。');
      this.partnerForm.reset({ spaceType: '' });
    } else {
      // 驗證失敗時強制觸發深咖啡色底線狀態
      this.partnerForm.markAllAsTouched();
    }
  }
}