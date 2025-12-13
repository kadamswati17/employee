import { Component, OnInit } from '@angular/core';
import { Receipt } from 'src/app/models/receipt.model';
import { ReceiptService } from 'src/app/services/receiptService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';

@Component({
  selector: 'app-receipt-list',
  templateUrl: './receipt-list.component.html',
  styleUrls: ['./receipt-list.component.css']
})
export class ReceiptListComponent implements OnInit {

  receipts: Receipt[] = [];
  paginatedReceipts: Receipt[] = [];
  ledger: any[] = [];
  customerInfo: any = {};
  loggedInUser: any = {};

  page = 1;
  pageSize = 6;
  totalPages = 1;

  selectedCustomerId: number | string | null = null;
  todayDate: string = "";

  constructor(
    private receiptService: ReceiptService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadReceipts();

    const userJson = localStorage.getItem('currentUser');
    if (userJson) this.loggedInUser = JSON.parse(userJson);

    this.todayDate = new Date().toISOString().split("T")[0];
  }

  loadReceipts() {
    this.receiptService.getAll().subscribe({
      next: (res: Receipt[]) => {
        this.receipts = res || [];
        this.totalPages = Math.max(1, Math.ceil(this.receipts.length / this.pageSize));
        this.setPage(this.page > this.totalPages ? 1 : this.page);  // 🟢 FIX
      }
    });
  }


  setPage(p: number) {
    this.page = p;
    const start = (p - 1) * this.pageSize;
    this.paginatedReceipts = this.receipts.slice(start, start + this.pageSize);
  }

  prevPage() { if (this.page > 1) this.setPage(this.page - 1); }
  nextPage() { if (this.page < this.totalPages) this.setPage(this.page + 1); }

  normalizeImageForView(image: string | undefined) {
    if (!image) return "";
    if (image.startsWith("data:")) return image;
    return `data:image/jpeg;base64,${image}`;
  }

  openCustomerReceipts(customerId: number | string) {
    this.selectedCustomerId = customerId;

    this.receiptService.getLedger(customerId).subscribe({
      next: (res: any) => {
        this.customerInfo = res.customerInfo || {};
        this.ledger = res.ledger || [];
        this.loggedInUser = res.loggedInUser || this.loggedInUser;

        // ⭐ FIX: Get latest updated mobile from receipt list
        if (this.ledger.length > 0) {
          const latestReceipt = this.ledger[this.ledger.length - 1]; // last record
          if (latestReceipt.mobile) {
            this.customerInfo.mobile = latestReceipt.mobile;
          }
        }

        // image normalization (existing code)
        if (this.loggedInUser?.profileImage)
          this.loggedInUser.profileImage = this.normalizeImageForView(this.loggedInUser.profileImage);

        if (this.customerInfo?.parentImage)
          this.customerInfo.parentImage = this.normalizeImageForView(this.customerInfo.parentImage);
      }
    });
  }


  delete(id?: number) {
    if (!id || !confirm("Delete receipt?")) return;

    this.receiptService.delete(id).subscribe(() => {
      alert("Deleted successfully!");

      // 🔥 Remove from receipts array immediately
      this.receipts = this.receipts.filter(r => r.id !== id);

      // 🔥 Recalculate total pages
      this.totalPages = Math.max(1, Math.ceil(this.receipts.length / this.pageSize));

      // 🔥 Adjust current page if needed
      if (this.page > this.totalPages) {
        this.page = this.totalPages;
      }

      // 🔥 Refresh the paginated list instantly
      this.setPage(this.page);
    });
  }



  handlePDF(customerId?: number | string) {
    if (customerId) {
      this.selectedCustomerId = customerId;

      this.receiptService.getLedger(customerId).subscribe({
        next: (res: any) => {
          this.customerInfo = res.customerInfo || {};
          this.ledger = res.ledger || [];

          setTimeout(() => this.generatePDF(), 400);
        }
      });

      return;
    }

    this.generatePDF();
  }

  generatePDF() {
    const element = document.getElementById("ledger-content");
    if (!element) return;

    html2canvas(element, { scale: 3 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const paddingLeft = 4;
      const paddingRight = 4;
      const paddingTop = 4;

      const usableWidth = pageWidth - paddingLeft - paddingRight;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = paddingTop;

      pdf.addImage(imgData, "PNG", paddingLeft, position, usableWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + paddingTop;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", paddingLeft, position, usableWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ledger_${this.selectedCustomerId}.pdf`);
    });
  }

}
