import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FrontendHeader } from '../frontend-header/frontend-header';
import { FrontendFooter } from '../frontend-footer/frontend-footer';
import { ChatWidget } from '../chat-widget/chat-widget';

@Component({
  selector: 'app-frontend-layout',
  imports: [RouterOutlet, FrontendHeader, FrontendFooter, ChatWidget],
  templateUrl: './frontend-layout.html',
  styleUrl: './frontend-layout.css',
})
export class FrontendLayout {
  private router = inject(Router);

  get showFooter(): boolean {
    return !this.router.url.startsWith('/all-spaces');
  }
}
