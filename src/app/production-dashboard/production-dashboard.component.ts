import { Component, OnInit } from '@angular/core';
import { ProductionDashboardService } from '../services/productiondashboardservice';

@Component({
  selector: 'app-production-dashboard',
  templateUrl: './production-dashboard.component.html',
  styleUrls: ['./production-dashboard.component.css']
})
export class ProductionDashboardComponent implements OnInit {

  rows: any[] = [];
  filteredRows: any[] = [];
  paginatedRows: any[] = [];

  fromDate = '';
  toDate = '';

  // 🔥 Pagination Variables
  currentPage = 1;
  pageSize = 8;   // rows per page
  totalPages = 2;

  constructor(private service: ProductionDashboardService) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getDashboard().subscribe(res => {
      console.log(res);   // 🔥 keep for debug

      this.rows = res;    // ❌ no filtering

      this.filteredRows = [...this.rows];
      this.setupPagination();
    });
  }


  // 🔥 Setup Pagination
  setupPagination() {
    this.totalPages = Math.ceil(this.filteredRows.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedRows();
  }

  // 🔥 Update Current Page Data
  updatePaginatedRows() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRows = this.filteredRows.slice(start, end);
  }
  formatMinutes(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h + 'h ' + m + 'm';
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedRows();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedRows();
    }
  }

  applyFilters() {

    if (this.fromDate && this.toDate) {
      const fromCheck = new Date(this.fromDate).getTime();
      const toCheck = new Date(this.toDate).getTime();

      if (toCheck < fromCheck) {
        alert('To Date cannot be less than From Date');
        this.toDate = '';
        return;
      }
    }

    const from = this.fromDate ? new Date(this.fromDate).getTime() : null;
    const to = this.toDate ? new Date(this.toDate + 'T23:59:59').getTime() : null;

    this.filteredRows = this.rows.filter(r => {

      if (!r.createdDate) return true;

      const d = new Date(r.createdDate).getTime();

      return (!from || d >= from) && (!to || d <= to);
    });

    this.setupPagination();
  }

  clear() {
    this.fromDate = '';
    this.toDate = '';
    this.filteredRows = [...this.rows];
    this.setupPagination();
  }
}
