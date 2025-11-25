import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';
import { CustomerTrn } from '../models/customer.model';

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
  currentPage = 1;
  // items per page
  itemsPerPage = 7;
  isLoading = false;
  errorMessage = '';
  isBatchApproving: boolean = false;
  isBatchApproved: boolean = false;

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.isLoading = true;

    this.customerService.getAllBatches().subscribe({
      next: (data) => {
        // Sort DESC by bactno (latest first)
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

    // get selected batch from list
    const selected = this.batches.find(x => x.bactno === bactno);

    // set UI state from backend
    this.isBatchApproved = selected?.approved || false;

    this.customerService.getCustomersByBatch(bactno).subscribe({
      next: (data) => {
        this.batchTransactions = data;

        const modalElement = document.getElementById('batchModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
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
      error: (err) => {
        console.error('Approval error:', err);
        alert('Approval failed!');
      }
    });
  }

  approveBatch(bactno: number): void {
    this.isBatchApproving = true;

    this.customerService.approveBatch(bactno).subscribe({
      next: () => {
        this.isBatchApproving = false;
        this.isBatchApproved = true;

        this.loadBatches(); // refresh statuses
      }
    });
  }




  // Computed list for current page
  get paginatedBatches() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.batches.slice(start, end);
  }

  // Total pages
  get totalPages() {
    return Math.ceil(this.batches.length / this.itemsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  downloadBatch(bactno: number) {
    this.customerService.downloadBatch(bactno).subscribe({
      next: (file: Blob) => {

        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');

        a.href = url;
        a.download = `Batch-${bactno}.pdf`;  // or .xlsx or .csv
        a.click();

        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error("Download error:", err);
        alert("Failed to download file");
      }
    });
  }


}
