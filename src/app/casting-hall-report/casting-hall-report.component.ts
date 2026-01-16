import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CastingHallReportService } from '../services/CastingHallReportService';
import { ProductionService } from '../services/ProductionService';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-casting-hall-report',
  templateUrl: './casting-hall-report.component.html',
  styleUrls: ['./casting-hall-report.component.css']
})
export class CastingHallReportComponent implements OnInit {

  showForm = false;
  reportForm!: FormGroup;

  reportList: any[] = [];
  filteredList: any[] = [];
  productionList: any[] = [];

  editId: number | null = null;

  // 🔹 FILTER STATE
  filterFromDate = '';
  filterToDate = '';

  constructor(
    private fb: FormBuilder,
    private service: CastingHallReportService,
    private productionService: ProductionService
  ) { }

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.filterFromDate = today;
    this.filterToDate = today;

    this.reportForm = this.fb.group({
      reportDate: [today],
      batchNo: ['', Validators.required],
      size: [0],
      bedNo: [0],
      mouldNo: [0],
      castingTime: [''],
      consistency: [0],
      flowInCm: [0],
      castingTempC: [0],
      vt: [0],
      massTemp: [0],
      fallingTestMm: [0],
      testTime: [0],
      hTime: [0],
      remark: ['']
    });

    this.loadReports();
    this.loadProductionBatches();
  }

  loadProductionBatches() {
    this.productionService.getAll().subscribe(res => {
      this.productionList = res;
    });
  }

  loadReports() {
    this.service.getAll().subscribe(res => {
      this.reportList = res;
      this.applyFilters(); // ✅ apply date filter
    });
  }

  // ================= FILTER LOGIC =================
  applyFilters() {

    // 🚫 VALIDATION
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

    this.filteredList = this.reportList.filter(r => {

      // 🔥 USE reportDate IF PRESENT
      const dateValue = r.reportDate || r.createdDate;
      if (!dateValue) return false;

      const recordDate = new Date(dateValue).getTime();

      return (!from || recordDate >= from) &&
        (!to || recordDate <= to);
    });
  }


  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredList = [...this.reportList];
  }

  // ================= EXPORT =================
  exportPDF() {
    if (!this.filteredList.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();

    autoTable(doc, {
      head: [[
        'Batch No',
        'Date',
        'Size',
        'Bed No',
        'Mould No',
        'Casting Time'
      ]],
      body: this.filteredList.map(r => [
        r.batchNo,
        this.formatDate(r.createdDate),
        r.size,
        r.bedNo,
        r.mouldNo,
        r.castingTime
      ])
    });

    doc.save('casting-report.pdf');
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB'); // dd/MM/yyyy
  }



  exportExcel() {
    if (!this.filteredList.length) {
      alert('No data to export');
      return;
    }

    const excelData = this.filteredList.map(r => ({
      'Batch No': r.batchNo,
      'Date': this.formatDate(r.createdDate),
      'Size': r.size,
      'Bed No': r.bedNo,
      'Mould No': r.mouldNo,
      'Casting Time': r.castingTime
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Casting Report');
    XLSX.writeFile(wb, 'casting-report.xlsx');
  }


  // ================= CRUD =================
  openForm() {
    this.showForm = true;
    this.editId = null;
  }

  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;
    this.reportForm.patchValue(row);
  }

  delete(id: number) {
    if (confirm('Delete this casting report?')) {
      this.service.delete(id).subscribe(() => this.loadReports());
    }
  }

  submit() {
    const payload = {
      ...this.reportForm.value,
      userId: 1,
      branchId: 1,
      orgId: 1
    };

    const req$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.save(payload);

    req$.subscribe(() => {
      this.showForm = false;
      this.loadReports();
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

    // reset dropdown
    (event.target as HTMLSelectElement).value = '';
  }

  // ================= CANCEL =================
  cancel() {
    this.showForm = false;
    this.editId = null;
  }

}
