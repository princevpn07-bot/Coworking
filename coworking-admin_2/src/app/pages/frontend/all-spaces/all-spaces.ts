import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-spaces',
  imports: [CommonModule],
  templateUrl: './all-spaces.html',
  styleUrl: './all-spaces.css',
})
export class AllSpaces {
  spaces = [
    { name: 'The Timber Lounge', location: '捷運大安站 2 分鐘', price: '8,500', capacity: '8人', img: 'assets/Featured_space_01.png' },
    { name: 'Clay & Canvas Studio', location: '捷運信義安和站 5 分鐘', price: '12,000', capacity: '3人', img: 'assets/Featured_space_02.png' },
    { name: 'Zen Archive Office', location: '捷運南京復興站 3 分鐘', price: '15,000', capacity: '12人', img: 'assets/Featured_space_03.png' },
    { name: 'The Collective Workspace', location: '捷運市政府站 5 分鐘', price: '25,000', capacity: '20人', img: 'assets/Featured_space_04.png' },
    { name: 'Urban Nest Hub', location: '捷運中山站 4 分鐘', price: '9,800', capacity: '6人', img: 'assets/Featured_space_01.png' },
    { name: 'Creative Loft', location: '捷運忠孝敦化 2 分鐘', price: '18,000', capacity: '15人', img: 'assets/Featured_space_02.png' },
    { name: 'The Timber Lounge', location: '捷運大安站 2 分鐘', price: '8,500', capacity: '8人', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Clay & Canvas Studio', location: '捷運信義安和站 5 分鐘', price: '12,000', capacity: '3人', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800' },
    { name: 'Zen Archive Office', location: '捷運南京復興站 3 分鐘', price: '15,000', capacity: '12人', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800' },
    { name: 'The Collective Workspace', location: '捷運市政府站 5 分鐘', price: '25,000', capacity: '20人', img: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800' },
    { name: 'Clay & Canvas Studio', location: '捷運信義安和站 5 分鐘', price: '12,000', capacity: '3人', img: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=800' },
    { name: 'The Collective Workspace', location: '捷運市政府站 5 分鐘', price: '25,000', capacity: '20人', img: 'https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800' },
  ];
}
