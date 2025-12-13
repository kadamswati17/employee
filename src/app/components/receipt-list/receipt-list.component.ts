import { Component, OnInit } from '@angular/core';
import { Receipt } from 'src/app/models/receipt.model';
import { ReceiptService } from 'src/app/services/receiptService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/UserService';

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
    private router: Router,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadReceipts();

    const userJson = localStorage.getItem('currentUser');
    console.log("Loaded user from localStorage:", userJson);


    const storedUser = UserService.getUser();
    console.log("LOCAL STORAGE USER = ", storedUser);

    if (userJson) this.loggedInUser = JSON.parse(userJson);

    this.todayDate = new Date().toISOString().split("T")[0];
  }

  loadReceipts() {
    setTimeout(() => {
      this.receiptService.getAll().subscribe({
        next: (res: Receipt[]) => {
          console.log("Fetched receipts:", res);
          this.receipts = res || [];
          this.totalPages = Math.max(1, Math.ceil(this.receipts.length / this.pageSize));
          this.setPage(this.page > this.totalPages ? 1 : this.page);  // 🟢 FIX
        }
      });
    }, 500);

  }


  setPage(p: number) {
    this.page = p;
    const start = (p - 1) * this.pageSize;
    this.paginatedReceipts = this.receipts.slice(start, start + this.pageSize);
    console.log(`Set to page ${p}:`, this.paginatedReceipts);
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

        // ⭐ FIX IMAGE NORMALIZATION
        if (this.loggedInUser?.profileImage)
          this.loggedInUser.profileImage = this.normalizeImageForView(this.loggedInUser.profileImage);

        if (this.customerInfo?.parentImage)
          this.customerInfo.parentImage = this.normalizeImageForView(this.customerInfo.parentImage);

        // ⭐ WAIT for modal animation + DOM update
        setTimeout(() => console.log("Modal ready"), 500);
      }
    });
  }



  delete(id?: number) {
    if (!id || !confirm("Delete receipt?")) return;
    this.loadReceipts();

    this.receiptService.delete(id).subscribe(() => {
      // alert("Deleted successfully!");
      this.loadReceipts();

      // Remove from receipts array immediately
      this.receipts = this.receipts.filter(r => r.id !== id);

      // Recalculate total pages
      this.totalPages = Math.max(1, Math.ceil(this.receipts.length / this.pageSize));

      // Adjust current page
      if (this.page > this.totalPages) {
        this.page = this.totalPages;
      }

      // Refresh paginated list instantly
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
          // Ensure the loggedInUser is updated so the PDF shows the profile data
          this.loggedInUser = res.loggedInUser || this.loggedInUser;

          // Normalize the image if present
          if (this.loggedInUser?.profileImage)
            this.loggedInUser.profileImage = this.normalizeImageForView(this.loggedInUser.profileImage);

          // ⭐ Wait for Angular + DOM to finish rendering, then generate PDF
          setTimeout(() => this.generatePDF(), 800);
        }
      });

      return;
    }

    setTimeout(() => this.generatePDF(), 800);
  }


  generatePDF() {
    const source = document.getElementById("ledger-content");
    if (!source) return;

    // ⭐ Clone DOM to avoid Bootstrap fade issues
    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);

    html2canvas(clone, { scale: 3 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const padding = 8;
      const usableWidth = pageWidth - padding * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = padding;

      pdf.addImage(imgData, 'PNG', padding, position, usableWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + padding;
        pdf.addImage(imgData, 'PNG', padding, position, usableWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ledger_${this.selectedCustomerId}.pdf`);
    })
      .finally(() => document.body.removeChild(clone));
  }



  downloadLedgerPDF() {
    if (!this.selectedCustomerId) {
      alert("Please select a customer first");
      return;
    }

    // ⭐ Wait 600–800ms ALWAYS before generating PDF
    setTimeout(() => {
      this.handlePDF(this.selectedCustomerId!);
    }, 800);
  }




}
