import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  iconFor(type: string): string {
    if (type === 'success') return 'check_circle';
    if (type === 'error')   return 'error';
    if (type === 'warning') return 'warning';
    return 'info';
  }
}
