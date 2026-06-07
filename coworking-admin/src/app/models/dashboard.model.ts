export interface DashboardSummary {
  monthlyRevenue: number;
  activeContracts: number;
  todayBookings: number;
  expiringThisMonth: number;
}

export interface ExpiringContract {
  customerName: string | null;
  customerEmail: string | null;
  spaceNumber: string | null;
  endDate: string | null;
  daysRemaining: number;
  status: number | null;
}

export interface PendingPayment {
  customerName: string | null;
  customerEmail: string | null;
  spaceNumber: string | null;
  payDeadline: string | null;
  totalPrice: number | null;
}
