import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FrontendHeader } from '../frontend-header/frontend-header';
import { FrontendFooter } from '../frontend-footer/frontend-footer';

@Component({
  selector: 'app-frontend-layout',
  imports: [RouterOutlet, FrontendHeader, FrontendFooter],
  templateUrl: './frontend-layout.html',
  styleUrl: './frontend-layout.css',
})
export class FrontendLayout {}
