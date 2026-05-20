import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-my-orders',
  imports: [RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
  username: string;

  constructor(private auth: AuthService) {
    this.username = this.auth.getUsername();
  }
}
