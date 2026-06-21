import { Component, OnInit, inject, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DashboardService } from '../../../services/dashboard';
import { AuthService } from '../../../services/auth';
import { DashboardSummary, ExpiringContract, PendingPayment } from '../../../models/dashboard.model';

type PendingFilter = 'all' | 'soon' | 'overdue';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  encapsulation: ViewEncapsulation.None,
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  get isPartner(): boolean { return this.authService.isPartner(); }

  summary: DashboardSummary | null = null;
  expiringContracts: ExpiringContract[] = [];
  pendingPayments: PendingPayment[] = [];

  expiringDays: 7 | 30 | 180 = 7;
  pendingFilter: PendingFilter = 'all';

  get filteredPendingPayments(): PendingPayment[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    if (this.pendingFilter === 'overdue') {
      return this.pendingPayments.filter(p => {
        if (!p.payDeadline) return false;
        return new Date(p.payDeadline) < today;
      });
    }
    if (this.pendingFilter === 'soon') {
      return this.pendingPayments.filter(p => {
        if (!p.payDeadline) return false;
        const d = new Date(p.payDeadline);
        return d >= today && d <= threeDaysLater;
      });
    }
    return this.pendingPayments;
  }

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data) => { this.summary = data; this.cdr.markForCheck(); },
      error: (err) => console.error('Summary 載入失敗', err),
    });

    this.loadExpiringContracts();

    this.dashboardService.getPendingPayments().subscribe({
      next: (data) => { this.pendingPayments = data; this.cdr.markForCheck(); },
      error: (err) => console.error('待付款訂單載入失敗', err),
    });
  }

  setExpiringDays(days: 7 | 30 | 180): void {
    this.expiringDays = days;
    this.loadExpiringContracts();
  }

  setPendingFilter(filter: PendingFilter): void {
    this.pendingFilter = filter;
  }

  private loadExpiringContracts(): void {
    this.dashboardService.getExpiringContracts(this.expiringDays).subscribe({
      next: (data) => { this.expiringContracts = data; this.cdr.markForCheck(); },
      error: (err) => console.error('到期合約載入失敗', err),
    });
  }

  daysBadgeClass(days: number): string {
    if (days <= 3) return 'days-badge urgent';
    if (days <= 5) return 'days-badge warning';
    return 'days-badge normal';
  }

  pendingBadgeClass(deadline: string | null): string {
    if (!deadline) return 'status-badge pending';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    if (d < today) return 'status-badge overdue';
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 3) return 'status-badge soon';
    return 'status-badge pending';
  }

  pendingBadgeLabel(deadline: string | null): string {
    if (!deadline) return '待付款';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    if (d < today) return '已逾期';
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 3) return '即將逾期';
    return '待付款';
  }
}
