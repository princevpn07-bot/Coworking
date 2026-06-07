import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DashboardService } from '../../../services/dashboard';
import { DashboardSummary, ExpiringContract, PendingPayment } from '../../../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  summary: DashboardSummary | null = null;
  expiringContracts: ExpiringContract[] = [];
  pendingPayments: PendingPayment[] = [];

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data) => { this.summary = data; this.cdr.markForCheck(); },
      error: (err) => console.error('Summary 載入失敗', err),
    });

    this.dashboardService.getExpiringContracts().subscribe({
      next: (data) => { this.expiringContracts = data; this.cdr.markForCheck(); },
      error: (err) => console.error('到期合約載入失敗', err),
    });

    this.dashboardService.getPendingPayments().subscribe({
      next: (data) => { this.pendingPayments = data; this.cdr.markForCheck(); },
      error: (err) => console.error('待付款訂單載入失敗', err),
    });
  }

  daysBadgeClass(days: number): string {
    if (days <= 3) return 'days-badge urgent';
    if (days <= 5) return 'days-badge warning';
    return 'days-badge normal';
  }
}
