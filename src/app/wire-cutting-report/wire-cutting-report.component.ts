import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WireCuttingReportService } from '../services/WireCuttingReportService';
import { ProductionService } from '../services/ProductionService';
import * as bootstrap from 'bootstrap';
import { CastingHallReportService } from '../services/CastingHallReportService';
import { Router } from '@angular/router';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { WireCuttingReport } from '../models/wire-cutting';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-wire-cutting-report',
  templateUrl: './wire-cutting-report.component.html',
  styleUrls: ['./wire-cutting-report.component.css']
})
export class WireCuttingReportComponent implements OnInit {
  currentUserRole = '';

  showForm = false;
  form!: FormGroup;

  // list: any[] = [];
  // filteredList: any[] = [];
  productionList: any[] = [];

  editId: number | null = null;
  // selected: any = null;


  list: WireCuttingReport[] = [];
  filteredList: WireCuttingReport[] = [];
  // pagedList: WireCuttingReport[] = [];

  selected: WireCuttingReport | null = null;

  // importPreviewList: WireCuttingReport[] = [];
  // pagedImportPreview: WireCuttingReport[] = [];

  filterFromDate = '';
  filterToDate = '';
  castingList: any[] = [];

  allProductionList: any[] = [];
  availableProductionList: any[] = [];
  // ================= IMPORT =================
  showImportModal = false;
  importColumns: string[] = [];
  importPreviewList: any[] = [];
  pagedImportPreview: any[] = [];

  importPageSize = 5;
  importCurrentPage = 1;
  importTotalPages = 0;

  // ================= PAGINATION =================
  pageSize = 5;
  currentPage = 1;
  totalPages = 0;
  pagedList: any[] = [];


  constructor(
    private fb: FormBuilder,
    private service: WireCuttingReportService,
    private productionService: ProductionService,
    private castingService: CastingHallReportService,
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const today = new Date().toISOString().substring(0, 10);
    this.loadCurrentUserRole();

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
    this.loadCasting();
  }


  private buildMergedExportData() {
    return this.filteredList.map(cutting => {

      const production = this.allProductionList.find(
        p => p.batchNo === cutting.batchNo
      ) || {};

      const casting = this.castingList.find(
        c => c.batchNo === cutting.batchNo
      ) || {};

      return {
        ...production,
        ...casting,
        ...cutting
      };
    });
  }

  // ================= LOAD =================
  load() {
    this.service.getAll().subscribe(res => {
      this.list = res || [];
      this.applyFilters();
      this.filterAvailableBatches();   // ⭐ IMPORTANT
      this.updatePagination();
    });


  }
  loadCasting() {
    this.castingService.getAll().subscribe(res => {
      this.castingList = res || [];
    });
  }
  goToDashboard() {
    this.router.navigate(['/production-dashboard']);
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
    this.currentPage = 1;
    this.updatePagination();
  }


  updatePagination() {
    this.totalPages = Math.ceil(this.filteredList.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedList = this.filteredList.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filteredList = [...this.list];
    this.currentPage = 1;
    this.updatePagination();
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
    const userId = this.auth.getLoggedInUserId();

    const payload = {
      ...this.form.value,
      userId: userId,
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
  getApprovalLevels(r: any) {
    return {
      checkedBy: {
        name: r?.approvedByL1 || '—',
        level: r?.approvedByL1 ? 'L1' : ''
      },
      reviewedBy: {
        name: r?.approvedByL2 || '—',
        level: r?.approvedByL2 ? 'L2' : ''
      },
      approvedBy: {
        name: r?.approvedByL3 || '—',
        level: r?.approvedByL3 ? 'L3' : ''
      }
    };
  }


  approve() {
    if (!this.selected || this.selected.id == null) {
      alert('No record selected');
      return;
    }

    this.service.approve(this.selected.id).subscribe(() => {
      alert('Approved successfully');
      this.load();
    });
  }


  reject() {
    if (!this.selected || this.selected.id == null) {
      alert('No record selected');
      return;
    }

    const reason = prompt('Enter rejection reason');
    if (!reason) return;

    this.service.reject(this.selected.id, reason).subscribe(() => {
      alert('Rejected successfully');
      this.load();
    });
  }

  private toBackendDate(value: any): string {
    if (!value) return '';

    // already yyyy-MM-dd
    if (typeof value === 'string' && value.includes('-')) {
      return value;
    }

    // dd/MM/yyyy → yyyy-MM-dd
    const parts = value.split('/');
    if (parts.length === 3) {
      const [dd, mm, yyyy] = parts;
      return `${yyyy}-${mm}-${dd}`;
    }

    return '';
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


  private excelFieldConfig = [

    // ===== COMMON (once) =====
    { label: 'Batch No', key: 'batchNo' },
    { label: 'Production Date', key: 'createdDate', format: 'date' },
    { label: 'Shift', key: 'shift' },

    // ===== PRODUCTION =====
    { label: 'Silo No 1', key: 'siloNo1' },
    { label: 'Liter Weight 1', key: 'literWeight1' },
    { label: 'FA Solid 1', key: 'faSolid1' },

    { label: 'Silo No 2', key: 'siloNo2' },
    { label: 'Liter Weight 2', key: 'literWeight2' },
    { label: 'FA Solid 2', key: 'faSolid2' },

    { label: 'Total Solid', key: 'totalSolid' },
    { label: 'Water Liter', key: 'waterLiter' },
    { label: 'Cement Kg', key: 'cementKg' },
    { label: 'Lime Kg', key: 'limeKg' },
    { label: 'Gypsum Kg', key: 'gypsumKg' },
    { label: 'Sol Oil Kg', key: 'solOilKg' },
    { label: 'AI Power (gm)', key: 'aiPowerGm' },
    { label: 'Temperature (°C)', key: 'tempC' },

    { label: 'Casting Time', key: 'castingTime' },
    { label: 'Production Time', key: 'productionTime' },
    { label: 'Production Remark', key: 'productionRemark' },

    // ===== CASTING =====
    { label: 'Size', key: 'size' },
    { label: 'Bed No', key: 'bedNo' },
    { label: 'Mould No', key: 'mouldNo' },
    { label: 'Consistency', key: 'consistency' },
    { label: 'Flow (cm)', key: 'flowInCm' },
    { label: 'Casting Temp (°C)', key: 'castingTempC' },
    { label: 'V.T.', key: 'vt' },
    { label: 'Mass Temp', key: 'massTemp' },
    { label: 'Falling Test (mm)', key: 'fallingTestMm' },
    { label: 'Test Time', key: 'testTime' },
    { label: 'H Time', key: 'hTime' },
    { label: 'Casting Remark', key: 'remark' },

    // ===== WIRE CUTTING =====
    { label: 'Cutting Date', key: 'cuttingDate', format: 'date' },
    { label: 'Ball Test (mm)', key: 'ballTestMm' },
    { label: 'Cutting Time', key: 'time' },
    { label: 'Cutting Reason', key: 'otherReason' },

    // ===== APPROVAL =====
    { label: 'Approval Stage', key: 'approvalStage' },
    { label: 'Approved By L1', key: 'approvedByL1' },
    { label: 'Approved By L2', key: 'approvedByL2' },
    { label: 'Approved By L3', key: 'approvedByL3' }
  ];

  exportExcel() {
    if (!this.filteredList.length) {
      alert('No data to export');
      return;
    }

    const mergedRows = this.buildMergedExportData(); // 🔥 IMPORTANT

    const excelData = mergedRows.map(row => {
      const obj: any = {};

      this.excelFieldConfig.forEach(f => {
        let value = row[f.key];

        if (f.format === 'date' && value) {
          value = this.formatDate(value);
        }

        obj[f.label] =
          value !== null && value !== undefined ? value : '';
      });

      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Full Production Flow');
    XLSX.writeFile(wb, 'production-casting-cutting.xlsx');
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

  loadCurrentUserRole() {
    const role = localStorage.getItem('role') || '';
    this.currentUserRole = role.startsWith('ROLE_')
      ? role
      : `ROLE_${role}`;
  }

  canViewWireCutting(r: any): boolean {
    if (!r) return false;

    const stage = r.approvalStage || 'NONE';

    switch (this.currentUserRole) {

      case 'ROLE_L1':
        return stage === 'NONE'; // pending + rejected

      case 'ROLE_L2':
        return stage === 'L1';

      case 'ROLE_L3':
        return stage === 'L2' || stage === 'L3';

      case 'ROLE_ADMIN':
        return true;

      default:
        return false;
    }
  }

  canApproveWireCutting(r: any): boolean {
    if (!r) return false;

    const stage = r.approvalStage || 'NONE';

    return (
      (this.currentUserRole === 'ROLE_L1' && stage === 'NONE') ||
      (this.currentUserRole === 'ROLE_L2' && stage === 'L1') ||
      (this.currentUserRole === 'ROLE_L3' && stage === 'L2')
    );
  }

  canRejectWireCutting(r: any): boolean {
    if (!r) return false;

    const stage = r.approvalStage;

    if (stage === 'L3') return false;

    return (
      (this.currentUserRole === 'ROLE_L1' && stage === 'NONE') ||
      (this.currentUserRole === 'ROLE_L2' && stage === 'L1') ||
      (this.currentUserRole === 'ROLE_L3' && stage === 'L2')
    );
  }
  private excelToDtoMap: Record<string, string> = {
    'Batch No': 'batchNo',
    'Cutting Date': 'cuttingDate',
    'Mould No': 'mouldNo',
    'Size': 'size',
    'Ball Test (mm)': 'ballTestMm',
    'Cutting Time': 'time',
    'Other Reason': 'otherReason'
  };

  onImportSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;

    if (value === 'excel') {
      const fileInput = document.querySelector(
        'input[type="file"][accept=".xlsx,.xls"]'
      ) as HTMLInputElement;

      fileInput?.click();
    }

    (event.target as HTMLSelectElement).value = '';
  }
  private wireCuttingExcelColumns = [
    'Batch No',
    'Cutting Date',
    'Mould No',
    'Size',
    'Ball Test (mm)',
    'Cutting Time',
    'Other Reason'
  ];

  onExcelSelect(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.showImportModal = true;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false
      });

      if (!rawRows.length) {
        alert('Excel is empty');
        return;
      }

      // ✅ SHOW ONLY WIRE CUTTING COLUMNS IN PREVIEW
      this.importColumns = this.wireCuttingExcelColumns;

      // ✅ MAP ONLY WIRE CUTTING DATA
      this.importPreviewList = rawRows.map(row => {
        const dto: WireCuttingReport = {
          batchNo: row['Batch No'],
          cuttingDate: this.toBackendDate(row['Cutting Date']),
          mouldNo: Number(row['Mould No']),
          size: Number(row['Size']),
          ballTestMm: Number(row['Ball Test (mm)']),
          time: row['Cutting Time'],
          otherReason: row['Other Reason'],
          userId: 1,
          branchId: 1,
          orgId: 1
        };

        return dto;
      });


      this.importCurrentPage = 1;
      this.updateImportPagination();
    };

    reader.readAsBinaryString(file);
    event.target.value = '';
  }
  colToKey: Record<string, string> = {
    'Batch No': 'batchNo',
    'Cutting Date': 'cuttingDate',
    'Mould No': 'mouldNo',
    'Size': 'size',
    'Ball Test (mm)': 'ballTestMm',
    'Cutting Time': 'time',
    'Other Reason': 'otherReason'
  };

  updateImportPagination() {
    this.importTotalPages = Math.ceil(
      this.importPreviewList.length / this.importPageSize
    );

    const start = (this.importCurrentPage - 1) * this.importPageSize;
    const end = start + this.importPageSize;

    this.pagedImportPreview =
      this.importPreviewList.slice(start, end);
  }

  goToImportPage(p: number) {
    this.importCurrentPage = p;
    this.updateImportPagination();
  }

  nextImportPage() {
    if (this.importCurrentPage < this.importTotalPages) {
      this.importCurrentPage++;
      this.updateImportPagination();
    }
  }

  prevImportPage() {
    if (this.importCurrentPage > 1) {
      this.importCurrentPage--;
      this.updateImportPagination();
    }
  }
  saveImportedWireCutting() {
    if (!this.importPreviewList.length) {
      alert('No data to save');
      return;
    }

    this.service.importWireCutting({
      wireCuttings: this.importPreviewList
    }).subscribe({
      next: () => {
        alert('Wire Cutting imported successfully');
        this.closeImportModal();
        this.load();
      },
      error: () => alert('Import failed')
    });
  }

  closeImportModal() {
    this.showImportModal = false;
    this.importPreviewList = [];
    this.pagedImportPreview = [];
  }

}
