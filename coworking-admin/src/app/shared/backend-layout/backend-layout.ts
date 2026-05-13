import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-backend-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './backend-layout.html',
  styleUrl: './backend-layout.css',
})
export class BackendLayout implements OnInit {
  pageTitle = '';

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.pageTitle = this.getTitle();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.pageTitle = this.getTitle());
  }

  private getTitle(): string {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    return route.snapshot.data['title'] ?? '';
  }
}
