
import { Component, OnInit } from '@angular/core';
import { Production } from '../models/production.model';
import { ProductionDashboardService } from '../services/productiondashboardservice';
// import { ProductionDashboardService } from './production-dashboard.service';
// import { Production } from './production.model';

@Component({
  selector: 'app-production-dashboard',
  templateUrl: './production-dashboard.component.html',
  styleUrls: ['./production-dashboard.component.css']
})
export class ProductionDashboardComponent implements OnInit {

  rows: any[] = [];
  filteredRows: any[] = [];

  fromDate = '';
  toDate = '';

  constructor(private service: ProductionDashboardService) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getDashboard().subscribe(res => {

      // hide fully approved
      this.rows = res.filter((r: any) =>
        !(r.approvalTimeL1 &&
          r.approvalTimeL2 &&
          r.approvalTimeL3 &&
          r.approvalTimeL4 &&
          r.approvalTimeL5 &&
          r.approvalTimeL6 &&
          r.approvalTimeL7)
      );

      this.filteredRows = [...this.rows];
    });
  }

  applyFilters() {

    // 🔴 validation first
    if (this.fromDate && this.toDate) {
      const fromCheck = new Date(this.fromDate).getTime();
      const toCheck = new Date(this.toDate).getTime();

      if (toCheck < fromCheck) {
        alert('To Date cannot be less than From Date');
        this.toDate = '';           // optional: clear To Date
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
  }

  clear() {
    this.fromDate = '';
    this.toDate = '';
    this.filteredRows = [...this.rows];
  }

}


