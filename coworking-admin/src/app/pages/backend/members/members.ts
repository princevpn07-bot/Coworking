import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../services/member';
import { AuthService } from '../../../services/auth';
import { CreateUserPayload, MemberItem, MemberPageData } from '../../../models/member.model';

@Component({
  selector: 'app-members',
  imports: [FormsModule],
  templateUrl: './members.html',
  styleUrl: './members.css',
})
export class Members implements OnInit {
  private memberService = inject(MemberService);
  private authService = inject(AuthService);
  private currentUserEmail = this.authService.getCurrentUserEmail();
  data: MemberPageData | null = null;
  activeTab: 'client' | 'staff' = 'client';
  searchQuery = '';

  setTab(tab: 'client' | 'staff'): void {
    this.activeTab = tab;
  }

  get filteredMembers() {
    if (!this.data?.memberList) return [];
    const q = this.searchQuery.trim().toLowerCase();
    return this.data.memberList.filter(m => {
      const matchTab = this.activeTab === 'client'
        ? m.role === 'client'
        : m.role === 'admin' || m.role === 'staff';
      if (!matchTab) return false;
      if (!q) return true;
      return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
    });
  }

  readonly showCreateModal = signal(false);
  readonly submitting = signal(false);
  readonly submitError = signal('');
  newUser: CreateUserPayload = this.emptyUser();

  private emptyUser(): CreateUserPayload {
    return { name: '', email: '', password: '', phone: '', role: 20 };
  }

  private avatarColorList = ['', 'bg-green', 'bg-blue', 'bg-purple', 'bg-orange', 'bg-red'];

  ngOnInit() {
    this.loadMemberPage();
  }

  private loadMemberPage(): void {
    this.memberService.getMemberPage().subscribe({
      next: (data) => (this.data = data),
      error: (err) => console.error('Failed to load member page', err),
    });
  }

  avatarColor(index: number): string {
    return this.avatarColorList[index % this.avatarColorList.length];
  }

  avatarInitial(name: string | null): string {
    return name ? name.charAt(0) : '?';
  }

  roleClass(role: string | null): string {
    if (role === 'admin') return 'admin';
    if (role === 'staff') return 'editor';
    if (role === 'client') return 'viewer';
    return 'viewer';
  }

  roleLabel(role: string | null): string {
    if (role === 'admin') return '管理員';
    if (role === 'staff') return '員工';
    if (role === 'client') return '客戶';
    return '未知';
  }

  openCreateModal(): void {
    this.newUser = this.emptyUser();
    this.submitError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  private validatePassword(password: string): string {
    if (password.length < 6) return '密碼至少需要 6 位';
    if (!/[a-z]/.test(password)) return '密碼需包含小寫字母';
    if (!/[A-Z]/.test(password)) return '密碼需包含大寫字母';
    if (!/[^a-zA-Z0-9]/.test(password)) return '密碼需包含特殊符號（如 !@#$%）';
    return '';
  }

  // ── Shared action state ──────────────────────────────────────────────────────
  selectedMember: MemberItem | null = null;
  readonly actionSubmitting = signal(false);
  readonly actionError = signal('');

  // ── Change Role ──────────────────────────────────────────────────────────────
  readonly showRoleModal = signal(false);
  pendingRole = 20;

  openRoleModal(member: MemberItem): void {
    this.selectedMember = member;
    this.pendingRole = this.roleValue(member.role);
    this.actionError.set('');
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void { this.showRoleModal.set(false); }

  submitRoleChange(): void {
    if (!this.selectedMember?.userId) return;
    this.actionSubmitting.set(true);
    this.memberService.updateRole(this.selectedMember.userId, this.pendingRole).subscribe({
      next: () => { this.actionSubmitting.set(false); this.closeRoleModal(); this.loadMemberPage(); },
      error: (err) => { this.actionError.set(err?.error ?? '更新失敗'); this.actionSubmitting.set(false); },
    });
  }

  isSelf(member: MemberItem): boolean {
    return !!this.currentUserEmail && member.email === this.currentUserEmail;
  }

  private roleValue(role: string | null): number {
    if (role === 'admin') return 99;
    if (role === 'staff') return 80;
    return 20;
  }

  // ── Reset Password ───────────────────────────────────────────────────────────
  readonly showResetModal = signal(false);

  openResetModal(member: MemberItem): void {
    this.selectedMember = member;
    this.actionError.set('');
    this.showResetModal.set(true);
  }

  closeResetModal(): void { this.showResetModal.set(false); }

  submitResetPassword(): void {
    if (!this.selectedMember?.userId) return;
    this.actionSubmitting.set(true);
    this.memberService.resetPassword(this.selectedMember.userId).subscribe({
      next: () => { this.actionSubmitting.set(false); this.closeResetModal(); },
      error: (err) => { this.actionError.set(err?.error ?? '重置失敗'); this.actionSubmitting.set(false); },
    });
  }

  // ── Block / Unblock ──────────────────────────────────────────────────────────
  readonly showBlockModal = signal(false);

  openBlockModal(member: MemberItem): void {
    this.selectedMember = member;
    this.actionError.set('');
    this.showBlockModal.set(true);
  }

  closeBlockModal(): void { this.showBlockModal.set(false); }

  submitToggleBlock(): void {
    if (!this.selectedMember?.userId) return;
    this.actionSubmitting.set(true);
    this.memberService.toggleBlock(this.selectedMember.userId).subscribe({
      next: () => { this.actionSubmitting.set(false); this.closeBlockModal(); this.loadMemberPage(); },
      error: (err) => { this.actionError.set(err?.error ?? '操作失敗'); this.actionSubmitting.set(false); },
    });
  }

  submitCreateUser(): void {
    if (!this.newUser.name.trim()) { this.submitError.set('請填寫姓名'); return; }
    if (!this.newUser.email.trim()) { this.submitError.set('請填寫電子郵件'); return; }
    if (!this.newUser.password.trim()) { this.submitError.set('請填寫密碼'); return; }
    const pwdError = this.validatePassword(this.newUser.password);
    if (pwdError) { this.submitError.set(pwdError); return; }

    this.submitting.set(true);
    this.submitError.set('');
    this.memberService.createUser(this.newUser).subscribe({
      next: () => {
        this.closeCreateModal();
        this.memberService.getMemberPage().subscribe({ next: (data) => (this.data = data) });
      },
      error: (err) => {
        this.submitError.set(err?.error ?? '新增失敗，請稍後再試');
        this.submitting.set(false);
      },
      complete: () => this.submitting.set(false),
    });
  }
}
