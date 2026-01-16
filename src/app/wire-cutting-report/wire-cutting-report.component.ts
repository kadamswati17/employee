import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WireCuttingReportService } from '../services/WireCuttingReportService';
import { ProductionService } from '../services/ProductionService';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-wire-cutting-report',
  templateUrl: './wire-cutting-report.component.html',
  styleUrls: ['./wire-cutting-report.component.css']
})
export class WireCuttingReportComponent implements OnInit {

  showForm = false;
  form!: FormGroup;

  list: any[] = [];
  filteredList: any[] = [];
  productionList: any[] = [];

  editId: number | null = null;

  // 🔹 FILTER STATE
  filterFromDate = '';
  filterToDate = '';

  constructor(
    private fb: FormBuilder,
    private service: WireCuttingReportService,
    private productionService: ProductionService
  ) { }

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.filterFromDate = today;
    this.filterToDate = today;

    this.form = this.fb.group({
      reportDate: [today],
      cuttingDate: [today, Validators.required],
      batchNo: ['', Validators.required],
      mouldNo: [0],
      size: [0],
      ballTestMm: [0],
      time: [''],
      otherReason: ['']
    });

    this.load();
    this.loadProduction();
  }

  load() {
    this.service.getAll().subscribe(res => {
      this.list = res;
      this.applyFilters();
    });
  }

  loadProduction() {
    this.productionService.getAll().subscribe(res => {
      this.productionList = res;
    });
  }

  applyFilters() {

    // 🚫 VALIDATION: To Date cannot be less than From Date
    if (
      this.filterFromDate &&
      this.filterToDate &&
      new Date(this.filterToDate) < new Date(this.filterFromDate)
    ) {
      alert('To Date cannot be earlier than From Date');
      return;
    }

    const from = this.filterFromDate
      ? new Date(this.filterFromDate).getTime()
      : null;

    const to = this.filterToDate
      ? new Date(this.filterToDate + 'T23:59:59').getTime()
      : null;

    this.filteredList = this.list.filter(r => {

      // ✅ FILTER ON CREATED DATE (DATE COLUMN)
      if (!r.createdDate) return false;

      const recordDate = new Date(r.createdDate).getTime();

      return (!from || recordDate >= from) &&
        (!to || recordDate <= to);
    });
  }


  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredList = [...this.list];
  }

  // ================= EXPORT =================
  exportPDF() {
    if (!this.filteredList.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();

    autoTable(doc, {
      head: [['Batch', 'Date', 'Cutting Date', 'Size', 'Ball Test']],
      body: this.filteredList.map(r => [
        r.batchNo,
        this.formatDate(r.createdDate),
        this.formatDate(r.cuttingDate),
        r.size,
        r.ballTestMm
      ])
    });

    doc.save('wire-cutting-report.pdf');
  }


  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB'); // dd/MM/yyyy
  }

  exportExcel() {
    if (!this.filteredList.length) {
      alert('No data to export');
      return;
    }

    const excelData = this.filteredList.map(r => ({
      'Batch No': r.batchNo,
      'Date': this.formatDate(r.createdDate),
      'Wire Cutting Date': this.formatDate(r.cuttingDate),
      'Mould No': r.mouldNo,
      'Size': r.size,
      'Ball Test (mm)': r.ballTestMm,
      // 'Reason': r.otherReason,
      // 'Time': r.time
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Wire Cutting Report');
    XLSX.writeFile(wb, 'wire-cutting-report.xlsx');
  }


  // ================= CRUD =================
  openForm() {
    this.showForm = true;
    this.editId = null;
  }

  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;
    this.form.patchValue(row);
  }

  delete(id: number) {
    if (confirm('Delete this wire cutting record?')) {
      this.service.delete(id).subscribe(() => this.load());
    }
  }

  submit() {
    const payload = {
      ...this.form.value,
      userId: 1,
      branchId: 1,
      orgId: 1
    };

    const req$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.save(payload);

    req$.subscribe(() => {
      this.showForm = false;
      this.load();
    });
  }

  // ================= EXPORT HANDLER =================
  onExportChange(event: Event) {
    const value = (event.target as HTMLSelectElement)?.value;

    if (value === 'pdf') {
      this.exportPDF();
    } else if (value === 'excel') {
      this.exportExcel();
    }

    (event.target as HTMLSelectElement).value = '';
  }

  // ================= CANCEL =================
  cancel() {
    this.showForm = false;
    this.editId = null;
  }

}
