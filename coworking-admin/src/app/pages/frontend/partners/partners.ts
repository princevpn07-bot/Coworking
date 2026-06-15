import { Component } from '@angular/core';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [],
  templateUrl: './partners.html',
  styleUrl: './partners.css',
})
export class Partners {
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

  steps = [
    { step: '01', title: '1. 主動聯繫', desc: '透過下方 LINE 管道與我們的專員取得聯繫，告知您的空間基本資訊。' },
    { step: '02', title: '2. 專人評估', desc: '我們的運營團隊將與您進行一對一溝通，評估空間條件與合作可行性。' },
    { step: '03', title: '3. 正式上線', desc: '確認合作後，您的空間將展示於 COVO 平台，向全球租客開啟預訂。' }
  ];
}
