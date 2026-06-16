import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSpaceAssertsDto, AdminSpaceInfoDto, CreateSpace, Location, SpaceAsset, SpaceImageItem, SpaceStatus, SpaceView } from '../../../models/space.model';
import { SpaceService } from '../../../services/space';
import { EquipmentService } from '../../../services/equipment';

const STATUS_MAP: Record<number, SpaceStatus> = {
  0: '可用',
  1: '使用中',
  2: '停用中',
  3: '清潔中',
};

@Component({
  selector: 'app-spaces',
  imports: [NgClass, FormsModule],
  templateUrl: './spaces.html',
  styleUrl: './spaces.css',
})
export class Spaces implements OnInit {
  private spaceService = inject(SpaceService);
  private equipmentService = inject(EquipmentService);

  // --- list state ---
  readonly loading = signal(true);
  readonly spaces = signal<SpaceView[]>([]);

  // --- filter state ---
  readonly filterOpen = signal(false);
  readonly filterLocation = signal(0);
  readonly filterMinCapacity = signal(0);
  readonly filterStatus = signal<SpaceStatus | ''>('');

  readonly locationFilterOptions = computed(() => {
    const seen = new Set<number>();
    const result: { id: number; name: string }[] = [];
    for (const s of this.spaces()) {
      if (s.locationId > 0 && !seen.has(s.locationId)) {
        seen.add(s.locationId);
        result.push({ id: s.locationId, name: s.location });
      }
    }
    return result;
  });

  readonly filteredSpaces = computed(() => {
    let list = this.spaces();
    const loc = this.filterLocation();
    const cap = this.filterMinCapacity();
    const status = this.filterStatus();
    if (loc > 0) list = list.filter(s => s.locationId === loc);
    if (cap > 0) list = list.filter(s => s.capacity >= cap);
    if (status) list = list.filter(s => s.status === status);
    return list;
  });

  readonly hasActiveFilter = computed(() =>
    this.filterLocation() > 0 || this.filterMinCapacity() > 0 || this.filterStatus() !== ''
  );

  readonly totalSpaces = computed(() => this.spaces().length);
  readonly availabilityRate = computed(() => {
    const all = this.spaces();
    if (all.length === 0) return '0%';
    const n = all.filter(s => s.status === '可用').length;
    return Math.round((n / all.length) * 100) + '%';
  });
  readonly pendingTurnaround = computed(() =>
    this.spaces().filter(s => s.status === '清潔中').length
  );

  // --- panel state ---
  readonly panelOpen = signal(false);
  readonly selectedSpace = signal<SpaceView | null>(null);
  readonly assetsLoading = signal(false);
  readonly panelAssets = signal<SpaceAsset[]>([]);
  readonly panelEditMode = signal(false);
  readonly panelUpdating = signal(false);
  readonly panelUpdateError = signal('');
  readonly panelStatusError = signal('');
  readonly editDraft = signal<{ name: string; locationId: number; capacity: number; status: SpaceStatus; introduction: string | null } | null>(null);
  readonly panelImages = signal<SpaceImageItem[]>([]);
  readonly imagesLoading = signal(false);
  readonly uploadingImage = signal(false);

  // --- scrap state ---
  readonly scrapModeAssetId = signal<number | null>(null);
  readonly scrapTarget = signal<SpaceAsset | null>(null);
  readonly scrapAmount = signal(1);
  readonly scrapReason = signal('');
  readonly scrapping = signal(false);
  readonly scrapError = signal('');
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  onAssetMouseDown(asset: SpaceAsset): void {
    this.longPressTimer = setTimeout(() => this.scrapModeAssetId.set(asset.assertsId), 700);
  }

  onAssetMouseUp(): void {
    if (this.longPressTimer) { clearTimeout(this.longPressTimer); this.longPressTimer = null; }
  }

  exitScrapMode(): void { this.scrapModeAssetId.set(null); }

  openScrapModal(asset: SpaceAsset): void {
    this.scrapTarget.set(asset);
    this.scrapAmount.set(1);
    this.scrapReason.set('');
    this.scrapError.set('');
  }

  closeScrapModal(): void {
    this.scrapTarget.set(null);
    this.scrapModeAssetId.set(null);
  }

  submitScrap(): void {
    const asset = this.scrapTarget();
    const space = this.selectedSpace();
    if (!asset || !space) return;
    if (this.scrapAmount() < 1 || this.scrapAmount() > asset.amount) {
      this.scrapError.set(`報廢數量需介於 1 ~ ${asset.amount}`); return;
    }
    this.scrapping.set(true);
    this.scrapError.set('');
    this.equipmentService.scrapAsset(asset.assertsId, this.scrapAmount(), this.scrapReason()).subscribe({
      next: () => {
        this.scrapping.set(false);
        this.closeScrapModal();
        this.loadSpaces();
        this.spaceService.getSpaceAssets(space.id).subscribe({
          next: (data) => this.panelAssets.set(data.map(d => this.toSpaceAsset(d))),
        });
      },
      error: (err) => {
        this.scrapError.set(err?.error?.message ?? '報廢失敗，請稍後再試');
        this.scrapping.set(false);
      },
    });
  }

  // --- transfer state ---
  readonly transferAsset = signal<SpaceAsset | null>(null);
  readonly transferTargetSpaceId = signal(0);
  readonly transferAmount = signal(1);
  readonly transferring = signal(false);
  readonly transferError = signal('');

  get transferTargetSpaces(): SpaceView[] {
    const current = this.selectedSpace();
    return this.spaces().filter(s => s.id !== current?.id && s.locationId === current?.locationId);
  }

  openTransferModal(asset: SpaceAsset): void {
    this.transferAsset.set(asset);
    this.transferTargetSpaceId.set(0);
    this.transferAmount.set(1);
    this.transferError.set('');
  }

  closeTransferModal(): void {
    this.transferAsset.set(null);
  }

  submitTransfer(): void {
    const asset = this.transferAsset();
    const space = this.selectedSpace();
    if (!asset || !space) return;
    if (!this.transferTargetSpaceId()) { this.transferError.set('請選擇目標空間'); return; }
    if (this.transferAmount() < 1 || this.transferAmount() > asset.amount) {
      this.transferError.set(`轉移數量需介於 1 ~ ${asset.amount}`); return;
    }
    this.transferring.set(true);
    this.transferError.set('');
    this.equipmentService.transferAllocation(asset.assertsId, this.transferTargetSpaceId(), this.transferAmount()).subscribe({
      next: () => {
        this.transferring.set(false);
        this.closeTransferModal();
        this.loadSpaces();
        this.spaceService.getSpaceAssets(space.id).subscribe({
          next: (data) => this.panelAssets.set(data.map(d => this.toSpaceAsset(d))),
        });
      },
      error: (err) => {
        this.transferError.set(err?.error?.message ?? '轉移失敗，請稍後再試');
        this.transferring.set(false);
      },
    });
  }

  // --- modal state ---
  readonly showCreateModal = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  readonly locationOptions = signal<Location[]>([]);
  readonly selectedFile = signal<File | null>(null);
  newSpace: CreateSpace = this.emptySpace();

  private emptySpace(): CreateSpace {
    return { location_id: 0, space_number: '', capacity: 1, status: 0, introduction: null, hourly_price: null, daily_price: null, monthly_price: null };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  ngOnInit(): void {
    this.loadSpaces();
  }

  private loadSpaces(): void {
    this.loading.set(true);
    this.spaceService.getSpaceInfo().subscribe({
      next: (data: AdminSpaceInfoDto[]) => {
        this.spaces.set(data.map(d => this.toSpaceView(d)));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load spaces', err);
        this.loading.set(false);
      },
    });
  }

  private toSpaceView(d: AdminSpaceInfoDto): SpaceView {
    return {
      id: d.space_id,
      locationId: d.location_id ?? 0,
      name: d.spacename ?? `SP-${d.space_id}`,
      location: d.locationname ?? '未知據點',
      capacity: d.capacity ?? 0,
      status: STATUS_MAP[d.status ?? 0] ?? '可用',
      assetCount: d.assetcount ?? 0,
      imagePath: d.imagePath ?? '',
      introduction: d.introduction ?? null,
    };
  }

  // --- filter ---
  toggleFilter(): void {
    this.filterOpen.update(v => !v);
  }

  clearFilter(): void {
    this.filterLocation.set(0);
    this.filterMinCapacity.set(0);
    this.filterStatus.set('');
  }

  // --- panel ---
  openPanel(space: SpaceView): void {
    this.selectedSpace.set(space);
    this.panelOpen.set(true);
    this.panelAssets.set([]);
    this.panelImages.set([]);
    this.panelEditMode.set(false);
    this.editDraft.set(null);
    this.panelStatusError.set('');
    this.assetsLoading.set(true);
    this.spaceService.getSpaceAssets(space.id).subscribe({
      next: (data: AdminSpaceAssertsDto[]) => {
        this.panelAssets.set(data.map(d => this.toSpaceAsset(d)));
        this.assetsLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load assets', err);
        this.assetsLoading.set(false);
      },
    });
    this.loadPanelImages(space.id);
  }

  private loadPanelImages(spaceId: number): void {
    this.imagesLoading.set(true);
    this.spaceService.getSpaceImages(spaceId).subscribe({
      next: (data) => { this.panelImages.set(data); this.imagesLoading.set(false); },
      error: () => this.imagesLoading.set(false),
    });
  }

  onPanelImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const space = this.selectedSpace();
    if (!file || !space) return;
    this.uploadingImage.set(true);
    this.spaceService.uploadSpaceImage(space.id, file).subscribe({
      next: (img) => {
        this.panelImages.update(list => [...list, img]);
        if (this.panelImages().length === 1) {
          this.spaces.update(list => list.map(s => s.id === space.id ? { ...s, imagePath: img.image_path ?? '' } : s));
          this.selectedSpace.update(s => s ? { ...s, imagePath: img.image_path ?? '' } : s);
        }
        this.uploadingImage.set(false);
        input.value = '';
      },
      error: () => this.uploadingImage.set(false),
    });
  }

  deletePanelImage(id: number): void {
    this.spaceService.deleteSpaceImage(id).subscribe({
      next: () => {
        this.panelImages.update(list => list.filter(i => i.id !== id));
        const space = this.selectedSpace();
        if (space && this.panelImages().length === 0) {
          this.spaces.update(list => list.map(s => s.id === space.id ? { ...s, imagePath: '' } : s));
          this.selectedSpace.update(s => s ? { ...s, imagePath: '' } : s);
        }
      },
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.panelEditMode.set(false);
    this.editDraft.set(null);
    setTimeout(() => {
      this.selectedSpace.set(null);
      this.panelAssets.set([]);
    }, 300);
  }

  // --- panel edit ---
  openEditMode(): void {
    const s = this.selectedSpace();
    if (!s) return;
    this.editDraft.set({ name: s.name, locationId: s.locationId, capacity: s.capacity, status: s.status, introduction: s.introduction });
    this.panelUpdateError.set('');
    this.panelEditMode.set(true);
    if (this.locationOptions().length === 0) {
      this.spaceService.getLocations().subscribe({
        next: (data) => this.locationOptions.set(data),
        error: () => {},
      });
    }
  }

  cancelEditMode(): void {
    this.panelEditMode.set(false);
    this.editDraft.set(null);
    this.panelUpdateError.set('');
  }

  savePanel(): void {
    const s = this.selectedSpace();
    const draft = this.editDraft();
    if (!s || !draft) return;
    if (!draft.name.trim()) { this.panelUpdateError.set('請填寫空間名稱'); return; }
    if (!draft.locationId) { this.panelUpdateError.set('請選擇據點'); return; }
    const STATUS_REVERSE: Record<SpaceStatus, number> = { '可用': 0, '使用中': 1, '停用中': 2, '清潔中': 3 };
    const payload = {
      space_id: s.id,
      location_id: draft.locationId,
      space_number: draft.name,
      capacity: draft.capacity,
      status: STATUS_REVERSE[draft.status],
      introduction: draft.introduction,
    };
    this.panelUpdating.set(true);
    this.panelUpdateError.set('');
    this.spaceService.update(payload as any).subscribe({
      next: () => {
        const updated: SpaceView = {
          ...s,
          name: draft.name,
          locationId: draft.locationId,
          location: this.locationOptions().find(l => l.location_id === draft.locationId)?.city ?? s.location,
          capacity: draft.capacity,
          status: draft.status,
          introduction: draft.introduction,
        };
        this.selectedSpace.set(updated);
        this.spaces.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.panelUpdating.set(false);
        this.panelEditMode.set(false);
        this.editDraft.set(null);
      },
      error: (err) => {
        this.panelUpdating.set(false);
        this.panelUpdateError.set(err?.error?.message ?? '儲存失敗，請稍後再試');
      },
    });
  }

  // --- create modal ---
  openCreateModal(): void {
    this.newSpace = this.emptySpace();
    this.submitError.set('');
    this.showCreateModal.set(true);
    if (this.locationOptions().length === 0) {
      this.spaceService.getLocations().subscribe({
        next: (data) => this.locationOptions.set(data),
        error: () => {},
      });
    }
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.selectedFile.set(null);
  }

  submitCreateSpace(): void {
    if (!this.newSpace.space_number.trim()) { this.submitError.set('請填寫空間編號／名稱'); return; }
    if (!this.newSpace.location_id) { this.submitError.set('請選擇據點'); return; }
    if (this.newSpace.capacity < 1) { this.submitError.set('容納人數至少為 1'); return; }
    this.submitting.set(true);
    this.submitError.set('');
    this.spaceService.createspace(this.newSpace).subscribe({
      next: (created) => {
        const file = this.selectedFile();
        if (file) {
          this.spaceService.uploadSpaceImage(created.space_id, file).subscribe({
            next: () => { this.submitting.set(false); this.showCreateModal.set(false); this.selectedFile.set(null); this.loadSpaces(); },
            error: () => { this.submitting.set(false); this.showCreateModal.set(false); this.selectedFile.set(null); this.loadSpaces(); },
          });
        } else {
          this.submitting.set(false);
          this.showCreateModal.set(false);
          this.selectedFile.set(null);
          this.loadSpaces();
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? '新增失敗，請稍後再試');
      },
    });
  }

  // --- quick status update (panel view mode) ---
  updatePanelStatus(newStatus: SpaceStatus): void {
    const s = this.selectedSpace();
    if (!s) return;
    this.panelStatusError.set('');
    const updated: SpaceView = { ...s, status: newStatus };
    this.selectedSpace.set(updated);
    this.spaces.update(list => list.map(item => item.id === updated.id ? updated : item));
    const STATUS_REVERSE: Record<SpaceStatus, number> = { '可用': 0, '使用中': 1, '停用中': 2, '清潔中': 3 };
    const payload = {
      space_id: s.id,
      location_id: s.locationId > 0 ? s.locationId : null,
      space_number: s.name,
      capacity: s.capacity,
      status: STATUS_REVERSE[newStatus],
    };
    this.spaceService.update(payload as any).subscribe({
      next: () => {},
      error: (err) => {
        console.error('狀態更新失敗', err);
        this.panelStatusError.set(err?.error?.message ?? `狀態更新失敗（HTTP ${err?.status ?? '?'}）`);
        this.selectedSpace.set(s);
        this.spaces.update(list => list.map(item => item.id === s.id ? s : item));
      },
    });
  }

  // --- asset helpers ---
  private toSpaceAsset(d: AdminSpaceAssertsDto): SpaceAsset {
    return {
      assertsId: d.asserts_id,
      id: d.equipment_id,
      name: d.equipmentname ?? '未知設備',
      icon: this.getAssetIcon(d.equipmentname ?? ''),
      amount: d.amount ?? 0,
    };
  }

  private getAssetIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('椅') || n.includes('chair')) return 'chair';
    if (n.includes('桌') || n.includes('desk') || n.includes('table')) return 'desk';
    if (n.includes('投影') || n.includes('projector')) return 'cast_connected';
    if (n.includes('白板') || n.includes('whiteboard')) return 'edit_square';
    if (n.includes('視訊') || n.includes('webcam') || n.includes('camera')) return 'videocam';
    if (n.includes('電視') || n.includes('螢幕') || n.includes('lcd') || n.includes('tv')) return 'tv';
    if (n.includes('wifi') || n.includes('網路')) return 'wifi';
    if (n.includes('冷氣') || n.includes('air')) return 'ac_unit';
    if (n.includes('插座') || n.includes('outlet') || n.includes('電源')) return 'power';
    if (n.includes('飲水') || n.includes('water')) return 'water_drop';
    return 'inventory_2';
  }

  getSpaceBadgeClass(status: SpaceStatus): string {
    const map: Record<SpaceStatus, string> = {
      '可用': 'badge-available',
      '使用中': 'badge-occupied',
      '停用中': 'badge-disabled',
      '清潔中': 'badge-cleaning',
    };
    return map[status];
  }
}
