import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-frontend-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './frontend-header.html',
  styleUrl: './frontend-header.css',
})
export class FrontendHeader {}
