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
  isBatchApproved = false;

  currentUserRole = '';   // ROLE_L1 / ROLE_L2 / ROLE_L3

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUserRole = this.authService.getCurrentUser().role;
    this.loadBatches();
  }

  loadBatches(): void {
    this.isLoading = true;
    this.customerService.getAllBatches().subscribe({
      next: (data) => {
        this.batches = data.sort((a, b) => b.bactno - a.bactno);
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

    this.isBatchApproved = this.selectedBatch?.approved || false;

    this.customerService.getCustomersByBatch(bactno).subscribe({
      next: (data) => {
        this.batchTransactions = data;

        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          new bootstrap.Modal(modalElement).show();
        }
      }
    });
  }

  addCustomer(): void {
    this.router.navigate(['/customers/add']);
  }

  approveTransaction(t: CustomerTrn): void {
    this.customerService.approveCustomer(t.id!).subscribe({
      next: (updated) => {
        t.status = updated.status;
      },
      error: () => alert('Approval failed!')
    });
  }

  // 🔥 L1 → L2 → L3 approval rules
  canApprove(): boolean {
    const batch = this.selectedBatch;
    if (!batch) return false;

    const stage = batch.approvalStage || "NONE";

    return (
      (this.currentUserRole === "ROLE_L1" && stage === "NONE") ||
      (this.currentUserRole === "ROLE_L2" && stage === "L1") ||
      (this.currentUserRole === "ROLE_L3" && stage === "L2")
    );
  }

  // 🔥 FIXED: Immediately disable button after approval
  approveBatch(bactno: number): void {
    this.isBatchApproving = true;

    this.customerService.approveBatch(bactno).subscribe({
      next: (updatedBatch) => {
        this.isBatchApproving = false;

        // 🔥 Update selectedBatch instantly (so UI updates immediately)
        this.selectedBatch.approvalStage = updatedBatch.approvalStage;

        // 🔥 Update batch list also (keeps footer correct)
        const index = this.batches.findIndex(b => b.bactno === bactno);
        if (index !== -1) {
          this.batches[index].approvalStage = updatedBatch.approvalStage;
        }

        // Re-evaluate approval
        this.isBatchApproved = true;

        // L1 will no longer see this batch after refresh
        this.loadBatches();
      },
      error: () => {
        this.isBatchApproving = false;
        alert("Approval failed");
      }
    });
  }

  get paginatedBatches() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.batches.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.batches.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  downloadBatch(bactno: number): void {
    this.customerService.downloadBatch(bactno).subscribe({
      next: (file: Blob) => {
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');

        a.href = url;
        a.download = `Batch-${bactno}.pdf`;
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => alert("Download failed")
    });
  }

  // 🔥 Footer values
  getApprovalLevels(batch: any) {
    if (!batch) return { checkedBy: "", reviewedBy: "", approvedBy: "" };

    const stage = batch.approvalStage;

    let checkedBy = "";
    let reviewedBy = "";
    let approvedBy = "";

    if (stage === "L1") checkedBy = "L1";
    if (stage === "L2") { checkedBy = "L1"; reviewedBy = "L2"; }
    if (stage === "L3") { checkedBy = "L1"; reviewedBy = "L2"; approvedBy = "L3"; }

    return { checkedBy, reviewedBy, approvedBy };
  }

  // 🔥 Disable approve button for L1 after approving
  isL1AlreadyApproved(): boolean {
    if (!this.selectedBatch) return false;
    return this.currentUserRole === "ROLE_L1" &&
      this.selectedBatch.approvalStage !== "NONE";
  }

}
