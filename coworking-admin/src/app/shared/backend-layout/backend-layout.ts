import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

@Component({
  selector: 'app-backend-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './backend-layout.html',
  styleUrl: './backend-layout.css',
})
export class BackendLayout implements OnInit, OnDestroy {
  pageTitle = '';
  currentTime = '';
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.pageTitle = this.getTitle();
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.pageTitle = this.getTitle());

    this.updateTime();
    this.timer = setInterval(() => this.updateTime(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private updateTime(): void {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const weekday = WEEKDAYS[now.getDay()];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.currentTime = `${y}年${m}月${d}日 ${weekday} ${hh}:${mm}`;
  }

  private getTitle(): string {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    return route.snapshot.data['title'] ?? '';
  }
}
