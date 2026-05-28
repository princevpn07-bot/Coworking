import { Component } from '@angular/core';

@Component({
  selector: 'app-payment-component',
  imports: [],
  templateUrl: './payment-component.html',
  styleUrl: './payment-component.css',
})
export class PaymentComponent {
  today: string = new Date().toISOString().split('T')[0];
  startDate = '';
  endDate = '';
  invoiceType = 'personal';

  onStartDateChange(event: Event): void {
    this.startDate = (event.target as HTMLInputElement).value;
  }

  onEndDateChange(event: Event): void {
    this.endDate = (event.target as HTMLInputElement).value;
  }

  onInvoiceTypeChange(event: Event): void {
    this.invoiceType = (event.target as HTMLSelectElement).value;
  }
}
