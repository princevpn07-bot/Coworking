import { Component, OnInit, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentService } from '../../../services/equipment';
import { SpaceService } from '../../../services/space';
import { AdminEquipmentCardDto, CreateEquipmentPayload } from '../../../models/equipment.model';
import { Space, Location } from '../../../models/space.model';

@Component({
  selector: 'app-resources',
  imports: [SlicePipe, FormsModule],
  templateUrl: './resources.html',
  styleUrl: './resources.css',
})
export class Resources implements OnInit {
  private equipmentService = inject(EquipmentService);
  private spaceService     = inject(SpaceService);

  cards: AdminEquipmentCardDto[] = [];
  spaces: Space[] = [];
  locations: Location[] = [];
  readonly loading = signal(true);

  // 篩選
  filterName     = '';
  filterCategory = '';

  get filteredCards(): AdminEquipmentCardDto[] {
    const name = this.filterName.trim().toLowerCase();
    return this.cards.filter(c => {
      const matchName = !name || (c.full_name?.toLowerCase().includes(name) ?? false);
      const matchCat  = !this.filterCategory || c.category === this.filterCategory;
      return matchName && matchCat;
    });
  }

  get allCategories(): string[] {
    return [...new Set(this.cards.map(c => c.category).filter((c): c is string => !!c))];
  }

  // 查看調配清單 (chip 點擊)
  readonly detailCard = signal<AdminEquipmentCardDto | null>(null);

  // 調配表單 (按鈕點擊)
  readonly allocatingCard = signal<AdminEquipmentCardDto | null>(null);
  readonly submitting     = signal(false);
  readonly submitError    = signal('');
  newAllocation = { space_id: 0, amount: 1 };

  // 新增資源 Modal
  readonly showCreateModal  = signal(false);
  readonly createSubmitting = signal(false);
  readonly createError      = signal('');
  newEquipment: CreateEquipmentPayload = this.emptyEquipment();

  private emptyEquipment(): CreateEquipmentPayload {
    return {
      location_id:  null,
      category:     '',
      full_name:    '',
      create_date:  new Date().toISOString().slice(0, 10),
      cost:         0,
      total_amount: 0,
    };
  }

  ngOnInit(): void {
    this.loadCards();
    this.loadSpaces();
    this.loadLocations();
  }

  private loadCards(): void {
    this.loading.set(true);
    this.equipmentService.getEquipmentCards().subscribe({
      next: (data) => { this.cards = data; this.loading.set(false); },
      error: (err) => { console.error('Failed to load equipment cards', err); this.loading.set(false); },
    });
  }

  private loadSpaces(): void {
    this.spaceService.getall().subscribe({
      next: (data) => { this.spaces = data; },
      error: (err) => console.error('Failed to load spaces', err),
    });
  }

  private loadLocations(): void {
    this.spaceService.getLocations().subscribe({
      next: (data) => { this.locations = data; },
      error: (err) => console.error('Failed to load locations', err),
    });
  }

  openCreateModal(): void {
    this.newEquipment = this.emptyEquipment();
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreate(): void {
    if (!this.newEquipment.full_name.trim()) { this.createError.set('請填寫資源名稱'); return; }
    if (!this.newEquipment.category.trim())  { this.createError.set('請填寫分類');     return; }
    if (this.newEquipment.total_amount < 1)  { this.createError.set('總數量至少為 1'); return; }

    this.createSubmitting.set(true);
    this.createError.set('');
    this.equipmentService.createEquipment(this.newEquipment).subscribe({
      next: () => {
        this.createSubmitting.set(false);
        this.closeCreateModal();
        this.loadCards();
      },
      error: () => {
        this.createError.set('新增失敗，請稍後再試');
        this.createSubmitting.set(false);
      },
    });
  }

  openDetailModal(card: AdminEquipmentCardDto): void {
    this.detailCard.set(card);
  }

  closeDetailModal(): void {
    this.detailCard.set(null);
  }

  openAllocateModal(card: AdminEquipmentCardDto): void {
    this.newAllocation = { space_id: 0, amount: 1 };
    this.submitError.set('');
    this.allocatingCard.set(card);
  }

  closeAllocateModal(): void {
    this.allocatingCard.set(null);
  }

  remainingAmount(card: AdminEquipmentCardDto): number {
    const allocated = card.allocations.reduce((sum, a) => sum + a.amount, 0);
    return (card.total_amount ?? 0) - allocated;
  }

  existingAllocation(allocations: AdminEquipmentCardDto['allocations'], spaceId: number) {
    if (!spaceId) return null;
    return allocations.find(a => a.space_id === spaceId) ?? null;
  }

  submitAllocation(): void {
    const card = this.allocatingCard();
    if (!card) return;
    if (!this.newAllocation.space_id) { this.submitError.set('請選擇空間'); return; }
    if (this.newAllocation.amount < 1) { this.submitError.set('數量至少為 1'); return; }

    const remaining = this.remainingAmount(card);
    if (this.newAllocation.amount > remaining) {
      this.submitError.set(`超過剩餘數量（剩餘 ${remaining} 件）`);
      return;
    }

    this.submitting.set(true);
    this.submitError.set('');

    const existing = card.allocations.find(a => a.space_id === this.newAllocation.space_id);
    const request$ = existing
      ? this.equipmentService.updateAllocation(
          existing.asserts_id,
          this.newAllocation.space_id,
          card.equipment_id,
          existing.amount + this.newAllocation.amount   // +n 邏輯
        )
      : this.equipmentService.addAllocation(
          this.newAllocation.space_id,
          card.equipment_id,
          this.newAllocation.amount
        );

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeAllocateModal();
        this.loadCards();
      },
      error: () => {
        this.submitError.set('調配失敗，請稍後再試');
        this.submitting.set(false);
      },
    });
  }

  categoryIcon(category: string | null): string {
    switch (category) {
      case '消耗品':   return 'cable';
      case '辦公傢俱': return 'chair';
      case '視聽設備': return 'videocam';
      case '網路設備': return 'router';
      case '電腦設備': return 'computer';
      default:         return 'inventory_2';
    }
  }
}
