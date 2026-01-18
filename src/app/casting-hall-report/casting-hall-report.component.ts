import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CastingHallReportService } from '../services/CastingHallReportService';
import { ProductionService } from '../services/ProductionService';
import * as bootstrap from 'bootstrap';

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

  availableProductionList: any[] = [];
  allProductionList: any[] = [];



  // selectedCasting: any = null;

  editId: number | null = null;

  filterFromDate = '';
  filterToDate = '';
  selectedCasting: any = null;

  constructor(
    private fb: FormBuilder,
    private service: CastingHallReportService,
    private productionService: ProductionService
  ) { }

  // ================= INIT =================
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

  // ================= LOAD =================
  loadProductionBatches() {
    this.productionService.getAll().subscribe(res => {
      this.allProductionList = res;          // ✅ keep all
      this.filterAvailableBatches();         // ✅ calculate available
    });
  }


  loadReports() {
    this.service.getAll().subscribe(res => {
      this.reportList = res;
      this.applyFilters();
      this.filterAvailableBatches();         // ⭐ important
    });
  }


  filterAvailableBatches() {
    if (!this.allProductionList.length) return;

    const usedBatchNos = this.reportList.map(r => r.batchNo);

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
    const to = this.filterToDate ? new Date(this.filterToDate + 'T23:59:59').getTime() : null;

    this.filteredList = this.reportList.filter(r => {
      const dateValue = r.reportDate || r.createdDate;
      if (!dateValue) return false;

      const recordDate = new Date(dateValue).getTime();
      return (!from || recordDate >= from) && (!to || recordDate <= to);
    });
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredList = [...this.reportList];
  }

  // ================= CRUD =================
  openForm() {
    this.showForm = true;
    this.editId = null;

    this.reportForm.reset({
      reportDate: new Date().toISOString().substring(0, 10)
    });

    // ✅ ADD MODE → show ONLY available batches
    this.productionList = [...this.availableProductionList];
  }


  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;

    this.reportForm.patchValue(row);

    // ✅ EDIT MODE → show ALL batches
    this.productionList = [...this.allProductionList];
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
      this.editId = null;
      this.loadReports();           // ✅ refresh table
    });
  }


  cancel() {
    this.showForm = false;
    this.editId = null;
  }

  // ================= MODAL =================
  openCastingModal(r: any) {
    this.selectedCasting = r;
    console.log(r);

    const modalEl = document.getElementById('castingModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  closeCastingModal() {
    const modalEl = document.getElementById('castingModal');
    if (!modalEl) return;

    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance?.hide();
  }


  // ================= EXPORT =================
  formatDate(date: any): string {
    return date ? new Date(date).toLocaleDateString('en-GB') : '';
  }

  exportPDF() {
    if (!this.filteredList.length) return;

    const doc = new jsPDF();
    autoTable(doc, {
      head: [['Batch No', 'Date', 'Size', 'Bed No', 'Mould No', 'Casting Time']],
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

  exportExcel() {
    if (!this.filteredList.length) return;

    const data = this.filteredList.map(r => ({
      'Batch No': r.batchNo,
      'Date': this.formatDate(r.createdDate),
      'Size': r.size,
      'Bed No': r.bedNo,
      'Mould No': r.mouldNo,
      'Casting Time': r.castingTime
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Casting Report');
    XLSX.writeFile(wb, 'casting-report.xlsx');
  }

  getCastingApprovalLevels(c: any) {
    return {
      checkedBy: {
        name: c?.approvedByL1Name ?? null,
        level: c?.approvedByL1 ? 'L1' : null
      },
      reviewedBy: {
        name: c?.approvedByL2Name ?? null,
        level: c?.approvedByL2 ? 'L2' : null
      },
      approvedBy: {
        name: c?.approvedByL3Name ?? null,
        level: c?.approvedByL3 ? 'L3' : null
      }
    };
  }


  // ================= ROLE LOGIC =================
  getCurrentUserRole(): string {
    const role = localStorage.getItem('role') || '';
    return role.replace('ROLE_', '').toUpperCase(); // ⭐ FIX
  }

  canApproveCasting(c: any): boolean {
    if (!c) return false;

    const role = this.getCurrentUserRole();

    if (c.approvalStage === 'APPROVED') return false;

    if (role === 'ADMIN') return true;
    if (role === 'L1') return !c.approvedByL1;
    if (role === 'L2') return c.approvedByL1 && !c.approvedByL2;
    if (role === 'L3') return c.approvedByL2 && !c.approvedByL3;

    return false;
  }

  canRejectCasting(c: any): boolean {
    if (!c) return false;
    if (c.approvalStage === 'APPROVED') return false;

    const role = this.getCurrentUserRole();
    return ['ADMIN', 'L1', 'L2', 'L3'].includes(role);
  }

  // ================= ACTIONS =================
  approveCasting() {
    this.service.approve(this.selectedCasting.id).subscribe(() => {
      alert('Approved successfully');
      this.reloadSelectedCasting();
      this.loadReports();
    });
  }

  rejectCasting() {
    const reason = prompt('Enter rejection reason');
    if (!reason) return;

    this.service.reject(this.selectedCasting.id, reason).subscribe(() => {
      alert('Rejected successfully');
      this.reloadSelectedCasting();
      this.loadReports();
    });
  }

  reloadSelectedCasting() {
    this.service.getById(this.selectedCasting.id).subscribe(res => {
      this.selectedCasting = res;
    });
  }
  onExportChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'pdf') {
      this.exportPDF();
    } else if (value === 'excel') {
      this.exportExcel();
    }

    // reset dropdown
    (event.target as HTMLSelectElement).value = '';
  }
  downloadCasting() {
    const c = this.selectedCasting;
    if (!c) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Casting Hall Report', 14, 15);

    const body = this.castingPdfFields.map(f => {
      let value = c[f.key];

      if (f.format === 'date' && value) {
        value = this.formatDate(value);
      }

      return [f.label, value ?? ''];
    });

    autoTable(doc, {
      startY: 25,
      head: [['Field', 'Value']],
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 120 }
      }
    });

    doc.save(`Casting-${c.batchNo}.pdf`);
  }
  private castingPdfFields = [
    { label: 'Batch No', key: 'batchNo' },
    { label: 'Date', key: 'createdDate', format: 'date' },

    { label: 'Size', key: 'size' },
    { label: 'Bed No', key: 'bedNo' },
    { label: 'Mould No', key: 'mouldNo' },
    { label: 'Casting Time', key: 'castingTime' },

    { label: 'Consistency', key: 'consistency' },
    { label: 'Flow (cm)', key: 'flowInCm' },
    { label: 'Casting Temp (°C)', key: 'castingTempC' },

    { label: 'V.T.', key: 'vt' },
    { label: 'Mass Temp', key: 'massTemp' },
    { label: 'Falling Test (mm)', key: 'fallingTestMm' },
    { label: 'Test Time', key: 'testTime' },
    { label: 'H Time', key: 'hTime' },

    { label: 'Remark', key: 'remark' },

    { label: 'Approved By L1', key: 'approvedByL1' },
    { label: 'Approved By L2', key: 'approvedByL2' },
    { label: 'Approved By L3', key: 'approvedByL3' }
  ];

}
