import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-backend-layout',
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './backend-layout.html',
  styleUrl: './backend-layout.css',
})
export class BackendLayout {}
