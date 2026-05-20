import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-frontend-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './frontend-header.html',
  styleUrl: './frontend-header.css',
})
export class FrontendHeader implements OnInit {
  isLoggedIn = false;
  username = '';
  showDropdown = false;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.auth.getUsername();
    }
  }

  get avatarInitial(): string {
    return this.username ? this.username.charAt(0).toUpperCase() : '?';
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.showDropdown = false;
    }
  }

  logout() {
    this.auth.logout();
    this.isLoggedIn = false;
    this.showDropdown = false;
    this.router.navigate(['/']);
  }
}
