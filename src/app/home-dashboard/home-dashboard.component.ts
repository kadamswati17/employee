import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-home-dashboard',
  templateUrl: './home-dashboard.component.html',
  styleUrls: ['./home-dashboard.component.css']
})
export class HomeDashboardComponent implements OnInit {

  inquiries: any[] = [];
  filtered: any[] = [];

  fromDate = '';
  toDate = '';
  status = '';

  summary: any = {
    OPEN: { count: 0, amount: 0 },
    IN_PROGRESS: { count: 0, amount: 0 },
    CLOSED: { count: 0, amount: 0 },
    SUCCESS: { count: 0, amount: 0 },
    CANCELLED: { count: 0, amount: 0 }
  };

  grandTotalAmount = 0;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadInquiries();
  }

  // ================= LOAD INQUIRY DATA =================
  loadInquiries(): void {
    this.http.get<any[]>('http://localhost:8080/api/inquiries')
      .subscribe(res => {
        this.inquiries = res || [];
        this.applyFilters();
      });
  }

  // ================= STATUS ID → NAME =================
  getStatusName(id: number): string {
    switch (id) {
      case 1: return 'OPEN';
      case 2: return 'IN_PROGRESS';
      case 3: return 'CLOSED';
      case 4: return 'SUCCESS';
      case 5: return 'CANCELLED';
      default: return '';
    }
  }

  // ================= FILTER =================
  applyFilters(): void {

    this.filtered = this.inquiries.filter(i => {
      let ok = true;

      if (this.fromDate) {
        ok = ok && new Date(i.inqueryDate) >= new Date(this.fromDate);
      }

      if (this.toDate) {
        ok = ok && new Date(i.inqueryDate) <= new Date(this.toDate);
      }

      if (this.status) {
        ok = ok && this.getStatusName(i.inqStatusId) === this.status;
      }

      return ok;
    });

    this.calculateSummary();
  }

  // ================= SUMMARY =================
  calculateSummary(): void {

    this.grandTotalAmount = 0;

    Object.keys(this.summary).forEach(k => {
      this.summary[k].count = 0;
      this.summary[k].amount = 0;
    });

    this.filtered.forEach(i => {

      const statusKey = this.getStatusName(i.inqStatusId);
      const amt = Number(i.total || 0);   // 🔥 FROM INQUIRY TABLE

      if (this.summary[statusKey]) {
        this.summary[statusKey].count++;
        this.summary[statusKey].amount += amt;
      }

      this.grandTotalAmount += amt;
    });
  }

  clear(): void {
    this.fromDate = '';
    this.toDate = '';
    this.status = '';
    this.applyFilters();
  }

  // ================= EXPORT =================
  exportData(type: string): void {

    if (!type || !this.filtered.length) return;

    const data = this.filtered.map((i, idx) => ({
      '#': idx + 1,
      'Inquiry ID': i.inqueryId,   // ✅ FIX HERE
      Status: this.getStatusName(i.inqStatusId),
      Date: i.inqueryDate,
      Amount: i.total
    }));


    if (type === 'pdf') {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [Object.keys(data[0])],
        body: data.map(d => Object.values(d))
      });
      doc.save('dashboard.pdf');
    }

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');
      XLSX.writeFile(wb, 'dashboard.xlsx');
    }
  }
}
