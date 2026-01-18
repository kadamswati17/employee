import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WireCuttingReportService } from '../services/WireCuttingReportService';
import { ProductionService } from '../services/ProductionService';
import * as bootstrap from 'bootstrap';

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
  selected: any = null;

  filterFromDate = '';
  filterToDate = '';

  allProductionList: any[] = [];
  availableProductionList: any[] = [];


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

  // ================= LOAD =================
  load() {
    this.service.getAll().subscribe(res => {
      this.list = res || [];
      this.applyFilters();
      this.filterAvailableBatches();   // ⭐ IMPORTANT
    });
  }


  loadProduction() {
    this.productionService.getAll().subscribe(res => {
      this.allProductionList = res || [];
      this.filterAvailableBatches();   // ⭐ IMPORTANT
    });
  }


  filterAvailableBatches() {
    if (!this.allProductionList.length) return;

    const usedBatchNos = this.list.map(r => r.batchNo);

    this.availableProductionList = this.allProductionList.filter(
      p => !usedBatchNos.includes(p.batchNo)
    );
  }

  // ================= FILTER =================
  applyFilters() {
    if (
      this.filterFromDate &&
      this.filterToDate &&
      new Date(this.filterToDate) < new Date(this.filterFromDate)
    ) {
      alert('To Date cannot be earlier than From Date');
      return;
    }

    const from = this.filterFromDate ? new Date(this.filterFromDate).getTime() : null;
    const to = this.filterToDate
      ? new Date(this.filterToDate + 'T23:59:59').getTime()
      : null;

    this.filteredList = this.list.filter(r => {
      if (!r.createdDate) return false;
      const d = new Date(r.createdDate).getTime();
      return (!from || d >= from) && (!to || d <= to);
    });
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredList = [...this.list];
  }

  // ================= CRUD =================
  openForm() {
    this.showForm = true;
    this.editId = null;

    this.form.reset({
      cuttingDate: new Date().toISOString().substring(0, 10)
    });

    // ✅ ADD MODE → show ONLY unused batches
    this.productionList = [...this.availableProductionList];
  }


  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;

    this.form.patchValue(row);

    // ✅ EDIT MODE → show ALL batches
    this.productionList = [...this.allProductionList];
  }


  delete(id: number) {
    if (confirm('Delete this wire cutting entry?')) {
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
      this.editId = null;
      this.load();           // recalculates available batches
    });

  }

  cancel() {
    this.showForm = false;
    this.editId = null;
  }

  // ================= MODAL =================
  openModal(r: any) {
    this.selected = r;
    const el = document.getElementById('wireCuttingModal');
    if (!el) return;
    new bootstrap.Modal(el).show();
  }

  closeModal() {
    const el = document.getElementById('wireCuttingModal');
    if (!el) return;
    bootstrap.Modal.getInstance(el)?.hide();
  }

  // ================= APPROVAL =================
  getApprovalLevels(r: any) {
    return {
      checkedBy: {
        name: r?.approvedByL1Name || '—',
        level: r?.approvedByL1 ? 'L1' : ''
      },
      reviewedBy: {
        name: r?.approvedByL2Name || '—',
        level: r?.approvedByL2 ? 'L2' : ''
      },
      approvedBy: {
        name: r?.approvedByL3Name || '—',
        level: r?.approvedByL3 ? 'L3' : ''
      }
    };
  }

  approve() {
    this.service.approve(this.selected.id).subscribe(() => {
      alert('Approved successfully');
      this.load();
    });
  }

  reject() {
    const reason = prompt('Enter rejection reason');
    if (!reason) return;

    this.service.reject(this.selected.id, reason).subscribe(() => {
      alert('Rejected successfully');
      this.load();
    });
  }

  // ================= EXPORT =================
  formatDate(d: any) {
    return d ? new Date(d).toLocaleDateString('en-GB') : '';
  }

  exportPDF() {
    if (!this.filteredList.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    autoTable(doc, {
      head: [[
        'Batch No',
        'Date',
        'Cutting Date',
        'Mould',
        'Size',
        'Ball Test',
        'Time'
      ]],
      body: this.filteredList.map(r => [
        r.batchNo,
        this.formatDate(r.createdDate),
        this.formatDate(r.cuttingDate),
        r.mouldNo,
        r.size,
        r.ballTestMm,
        r.time
      ])
    });

    doc.save('wire-cutting-register.pdf');
  }

  exportExcel() {
    const data = this.filteredList.map(r => ({
      'Batch No': r.batchNo,
      'Date': this.formatDate(r.createdDate),
      'Cutting Date': this.formatDate(r.cuttingDate),
      'Mould No': r.mouldNo,
      'Size': r.size,
      'Ball Test': r.ballTestMm,
      'Time': r.time
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wire Cutting');
    XLSX.writeFile(wb, 'wire-cutting.xlsx');
  }

  onExportChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'pdf') this.exportPDF();
    if (value === 'excel') this.exportExcel();
    (event.target as HTMLSelectElement).value = '';
  }

  // ================= DOWNLOAD SINGLE =================
  download() {
    const r = this.selected;
    if (!r) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Wire Cutting Report', 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [['Field', 'Value']],
      body: [
        ['Batch No', r.batchNo],
        ['Date', this.formatDate(r.createdDate)],
        ['Cutting Date', this.formatDate(r.cuttingDate)],
        ['Mould No', r.mouldNo],
        ['Size', r.size],
        ['Ball Test', r.ballTestMm],
        ['Time', r.time],
        ['Reason', r.otherReason || '—']
      ]
    });

    doc.save(`Wire-Cutting-${r.batchNo}.pdf`);
  }

}
