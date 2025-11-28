import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';
import { CustomerTrn } from '../models/customer.model';
import { AuthService } from '../services/auth.service';

declare var bootstrap: any;

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {

  batches: any[] = [];
  batchTransactions: CustomerTrn[] = [];
  selectedBatchNo?: number;
  selectedBatch: any = null;

  currentPage = 1;
  itemsPerPage = 7;

  isLoading = false;
  errorMessage = '';
  isBatchApproving = false;

  currentUserRole = '';   // ROLE_L1 / ROLE_L2 / ROLE_L3 / ROLE_ADMIN

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const current = this.authService.getCurrentUser();
    this.currentUserRole = current ? current.role : '';
    this.loadBatches();
  }

  loadBatches(): void {
    this.isLoading = true;
    this.customerService.getAllBatches().subscribe({
      next: (data) => {
        this.batches = (data || []).sort((a: any, b: any) => b.bactno - a.bactno);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load batches.';
        this.isLoading = false;
      }
    });
  }

  openBatchModal(bactno: number): void {
    this.selectedBatchNo = bactno;
    this.selectedBatch = this.batches.find(b => b.bactno === bactno) || null;

    this.customerService.getCustomersByBatch(bactno).subscribe({
      next: (data) => {
        this.batchTransactions = data || [];

        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        }
      },
      error: () => alert('Failed to load batch transactions')
    });
  }

  addCustomer(): void {
    this.router.navigate(['/customers/add']);
  }

  canApprove(): boolean {
    const batch = this.selectedBatch;
    if (!batch) return false;

    const stage = batch.approvalStage || 'NONE';

    return (
      (this.currentUserRole === 'ROLE_L1' && stage === 'NONE') ||
      (this.currentUserRole === 'ROLE_L2' && stage === 'L1') ||
      (this.currentUserRole === 'ROLE_L3' && stage === 'L2')
    );
  }

  approveBatch(bactno: number): void {
    if (!confirm('Are you sure you want to approve this batch?')) return;

    this.isBatchApproving = true;
    this.customerService.approveBatch(bactno).subscribe({
      next: (updatedBatch) => {
        this.isBatchApproving = false;

        if (updatedBatch) {
          this.selectedBatch = updatedBatch;
          const idx = this.batches.findIndex(b => b.bactno === bactno);
          if (idx !== -1) this.batches[idx] = updatedBatch;
        }

        this.loadBatches();
      },
      error: () => {
        this.isBatchApproving = false;
        alert('Approval failed');
      }
    });
  }

  rejectBatch(): void {
    if (!this.selectedBatchNo) return;

    const reason = prompt('Enter rejection reason:', '');
    if (reason === null) return;

    this.customerService.rejectBatch(this.selectedBatchNo, reason || undefined).subscribe({
      next: (updated) => {
        alert('Batch rejected successfully');
        this.selectedBatch = updated;

        const idx = this.batches.findIndex(b => b.bactno === this.selectedBatchNo);
        if (idx !== -1) this.batches[idx] = updated;

        this.loadBatches();
      },
      error: () => alert('Reject failed')
    });
  }

  editBatch(): void {
    if (!this.selectedBatchNo || !this.selectedBatch) return;
    if (!this.canEditDelete()) { alert('No permission'); return; }

    const newCreatedBy = prompt('Created by:', this.selectedBatch.createdby || '');
    if (newCreatedBy === null) return;

    const newDate = prompt('Transaction Date (YYYY-MM-DD):', this.formatDateForInput(this.selectedBatch.trndate));
    if (newDate === null) return;

    const payload = { createdby: newCreatedBy, trndate: newDate };

    this.customerService.updateBatch(this.selectedBatchNo, payload).subscribe({
      next: (updated) => {
        alert('Batch updated');
        this.selectedBatch = updated;

        const idx = this.batches.findIndex(b => b.bactno === this.selectedBatchNo);
        if (idx !== -1) this.batches[idx] = updated;

        this.loadBatches();
      },
      error: () => alert('Update failed')
    });
  }

  deleteBatch(): void {
    if (!this.selectedBatchNo) return;
    if (!this.canEditDelete()) { alert('No permission'); return; }

    if (!confirm('Delete this batch and all transactions?')) return;

    this.customerService.deleteBatch(this.selectedBatchNo).subscribe({
      next: () => {
        alert('Batch deleted');

        this.batches = this.batches.filter(b => b.bactno !== this.selectedBatchNo);
        this.selectedBatch = null;

        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) modal.hide();
        }
      },
      error: () => alert('Delete failed')
    });
  }

  downloadBatch(bactno: number): void {
    this.customerService.downloadBatch(bactno).subscribe({
      next: (file) => {
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Batch-${bactno}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Download failed')
    });
  }

  getApprovalLevels(batch: any) {
    if (!batch) return { checkedBy: '', reviewedBy: '', approvedBy: '' };

    return {
      checkedBy: batch.aproval1Name || '',
      reviewedBy: batch.aproval2Name || '',
      approvedBy: batch.aproval3Name || ''
    };
  }

  canEditDelete(): boolean {
    return this.currentUserRole === 'ROLE_ADMIN' || this.currentUserRole === 'ROLE_L1';
  }

  get paginatedBatches() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.batches.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.batches.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  private formatDateForInput(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`;
  }

  isL1AlreadyApproved(): boolean {
    return (
      this.currentUserRole === 'ROLE_L1' &&
      this.selectedBatch &&
      this.selectedBatch.approvalStage !== 'NONE'
    );
  }
}
