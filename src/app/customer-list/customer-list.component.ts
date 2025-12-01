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

  currentUserRole = '';

  // Inline edit support
  editingIndex: number | null = null;
  editModel: any = {};

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
        this.batches = data.sort((a: any, b: any) => b.bactno - a.bactno);
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
      next: (data: any[]) => {
        this.batchTransactions = data || [];

        if (data.length > 0 && data[0].batchDetails) {
          this.selectedBatch = data[0].batchDetails;
        }

        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          let modal = new bootstrap.Modal(modalElement);
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
      next: (updated) => {
        this.isBatchApproving = false;
        alert('Batch approved successfully!');

        // Close modal
        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          const instance = bootstrap.Modal.getInstance(modalElement);
          if (instance) instance.hide();
        }

        // Reload list
        this.loadBatches();

        // Redirect to customer page
        this.router.navigate(['/customers']);
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

    this.customerService.rejectBatch(this.selectedBatchNo, reason).subscribe({
      next: () => {
        alert('Batch rejected');

        // Close modal
        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          const instance = bootstrap.Modal.getInstance(modalElement);
          if (instance) instance.hide();
        }

        // Reload list
        this.loadBatches();

        // Redirect to customer page
        this.router.navigate(['/customers']);
      },
      error: () => alert('Reject failed')
    });
  }


  deleteBatch(): void {
    if (!this.selectedBatchNo) return;
    if (!confirm('Delete batch and all transactions?')) return;

    this.customerService.deleteBatch(this.selectedBatchNo).subscribe({
      next: () => {
        alert('Batch deleted');

        this.batches = this.batches.filter(b => b.bactno !== this.selectedBatchNo);
        this.selectedBatch = null;

        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          const instance = bootstrap.Modal.getInstance(modalElement);
          if (instance) instance.hide();
        }

        this.router.navigate(['/customers']);
      },
      error: () => alert('Delete failed')
    });
  }

  downloadBatch(bactno: number) {
    this.customerService.downloadBatch(bactno).subscribe({
      next: (file) => {
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Batch-${bactno}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => alert('Download failed')
    });
  }

  getApprovalLevels(batch: any) {
    return {
      checkedBy: {
        name: batch.aproval1Name || '',
        level: batch.aproval1Name ? 'L1' : ''
      },
      reviewedBy: {
        name: batch.aproval2Name || '',
        level: batch.aproval2Name ? 'L2' : ''
      },
      approvedBy: {
        name: batch.aproval3Name || '',
        level: batch.approval3Name ? 'L3' : ''
      }
    };
  }

  // Pagination
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

  isL1AlreadyApproved(): boolean {
    return this.currentUserRole === 'ROLE_L1' &&
      this.selectedBatch &&
      this.selectedBatch.approvalStage !== 'NONE';
  }

  // ----------------------------
  // 🔥 Inline Edit Logic
  // ----------------------------

  startEdit(index: number) {
    this.editingIndex = index;
    const item = this.batchTransactions[index];

    this.editModel = {
      customerName: item.customerName,
      toolingdrawingpartno: item.toolingdrawingpartno,
      partdrawingname: item.partdrawingname,
      partdrawingno: item.partdrawingno,
      descriptionoftooling: item.descriptionoftooling,
      cmworkorderno: item.cmworkorderno,
      toolingassetno: item.toolingassetno
    };
  }

  cancelEdit() {
    this.editingIndex = null;
    this.editModel = {};
  }

  saveEdit(id: number | undefined) {
    if (!id) {
      alert('Invalid transaction ID!');
      return;
    }

    this.customerService.updateCustomer(id, this.editModel).subscribe({
      next: () => {
        alert('Transaction updated');

        Object.assign(this.batchTransactions[this.editingIndex!], this.editModel);

        this.cancelEdit();
      },
      error: () => alert('Update failed')
    });
  }
  canEditDelete(): boolean {
    return this.currentUserRole === 'ROLE_ADMIN' || this.currentUserRole === 'ROLE_L1';
  }


}
