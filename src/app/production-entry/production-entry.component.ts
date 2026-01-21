import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ProductionService } from '../services/ProductionService';
import * as bootstrap from 'bootstrap';
import { ProductionImportResponse } from '../models/ProductionImportResponse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-production-entry',
  templateUrl: './production-entry.component.html',
  styleUrls: ['./production-entry.component.css']
})
export class ProductionEntryComponent implements OnInit {

  currentUserRole = '';

  selectedProduction: any = null;

  productionForm!: FormGroup;

  productionList: any[] = [];
  filteredProductionList: any[] = [];

  showForm = false;
  editId: number | null = null;

  siloList: number[] = [];
  showImportModal = false;   // 🔥 ADD THIS
  excelHeaders: string[] = [];
  excelRows: any[] = [];

  filterFromDate = '';
  filterToDate = '';
  excelPreview: any[] = [];
  hasExcelErrors = false;
  apiMessage = '';

  // ================= PAGINATION =================
  pageSize = 5;
  currentPage = 1;
  totalPages = 0;
  pagedProductionList: any[] = [];


  constructor(
    private fb: FormBuilder,
    private service: ProductionService
  ) { }

  ngOnInit(): void {


    console.log('ROLE IN COMPONENT:', this.currentUserRole);

    this.loadCurrentUserRole();




    this.siloList = Array.from({ length: 5 }, (_, i) => i + 1);

    const today = new Date().toISOString().substring(0, 10);
    this.filterFromDate = today;
    this.filterToDate = today;

    this.productionForm = this.fb.group({
      shift: [''],
      productionDate: [today],

      siloNo1: [''],
      literWeight1: [''],
      faSolid1: [''],

      siloNo2: [''],
      literWeight2: [''],
      faSolid2: [''],

      waterLiter: [''],
      cementKg: [''],
      limeKg: [''],
      gypsumKg: [''],
      solOilKg: [''],
      aiPowerGm: [''],
      tempC: [''],

      castingTime: [''],
      productionTime: [''],
      productionRemark: [''],
      remark: [''],

      userId: [1],
      branchId: [1],
      orgId: [1]
    });

    this.setShiftByTime();
    this.loadData();
  }


  loadCurrentUserRole() {
    const role = localStorage.getItem('role') || '';

    this.currentUserRole = role.startsWith('ROLE_')
      ? role
      : `ROLE_${role}`;

    console.log('ROLE IN COMPONENT:', this.currentUserRole);
  }


  openProductionModal(p: any) {
    this.selectedProduction = p;
    this.loadCurrentUserRole();
    const modalEl = document.getElementById('productionModal');
    if (!modalEl) return;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  loadData() {
    this.service.getAll().subscribe(res => {
      this.productionList = res || [];
      this.applyFilters();
      this.updatePagination();
    });
  }

  applyFilters() {
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

    this.filteredProductionList = this.productionList.filter(p => {

      // ✅ DATE FILTER
      const date = new Date(p.createdDate).getTime();
      const dateOk =
        (!from || date >= from) &&
        (!to || date <= to);

      if (!dateOk) return false;

      // ✅ ROLE FILTER
      const stage = p.approvalStage || 'NONE';

      switch (this.currentUserRole) {
        case 'ROLE_L1':
          return true; // sees all

        case 'ROLE_L2':
          return stage === 'L1';

        case 'ROLE_L3':
          return stage === 'L2';

        case 'ROLE_ADMIN':
          return true;

        default:
          return false;
      }
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(
      this.filteredProductionList.length / this.pageSize
    );

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.pagedProductionList =
      this.filteredProductionList.slice(start, end);
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
    this.filteredProductionList = [...this.productionList];
    this.currentPage = 1;
    this.updatePagination();
  }

  exportData(type: string) {

    // 🔥 force close import modal before export
    this.showImportModal = false;
    this.excelPreview = [];

    if (type === 'pdf') this.exportPDF();
    if (type === 'excel') this.exportExcel();
  }


  exportPDF() {
    if (!this.filteredProductionList.length) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFontSize(14);
    doc.text('Production Register', doc.internal.pageSize.getWidth() / 2, 12, {
      align: 'center'
    });

    const head = [
      this.productionFieldConfig.map(f => f.label)
    ];

    const body = this.filteredProductionList.map(p =>
      this.productionFieldConfig.map(f => {
        let value = p[f.key];

        if (f.format === 'date' && value) {
          value = this.formatDate(value);
        }

        return value ?? '';
      })
    );

    autoTable(doc, {
      startY: 18,
      head,
      body,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        halign: 'center'
      },
      margin: { left: 8, right: 8 }
    });

    doc.save('production-register.pdf');
  }

  // exportPDF() {
  //   if (!this.filteredProductionList.length) {
  //     alert('No data to export');
  //     return;
  //   }

  //   const doc = new jsPDF();

  //   this.filteredProductionList.forEach((p, index) => {

  //     if (index > 0) doc.addPage();

  //     doc.setFontSize(16);
  //     doc.text(`Production Register - Batch ${p.batchNo}`, 14, 15);

  //     const body = this.productionFieldConfig.map(f => {
  //       let value = p[f.key];
  //       if (f.format === 'date' && value) {
  //         value = this.formatDate(value);
  //       }
  //       return [f.label, value ?? ''];
  //     });

  //     autoTable(doc, {
  //       startY: 22,
  //       head: [['Field', 'Value']],
  //       body,
  //       styles: { fontSize: 10 },
  //       headStyles: {
  //         fillColor: [33, 150, 243],
  //         textColor: 255
  //       }
  //     });
  //   });

  //   doc.save('production-register.pdf');
  // }



  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB'); // dd/MM/yyyy
  }


  exportExcel() {
    if (!this.filteredProductionList.length) {
      alert('No data to export');
      return;
    }

    const excelData = this.filteredProductionList.map(p => {
      const row: any = {};

      this.productionFieldConfig.forEach(f => {
        let value = p[f.key];

        if (f.format === 'date' && value) {
          value = this.formatDate(value);
        }

        row[f.label] = value ?? '';
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'Production Register');
    XLSX.writeFile(wb, 'production-register.xlsx');
  }



  calculateTotalSolid(): number {
    return (+this.productionForm.value.faSolid1 || 0) +
      (+this.productionForm.value.faSolid2 || 0);
  }

  // TEMP USER MAP (until backend sends name)
  userMap: { [key: number]: string } = {
    1: 'Admin',
    2: 'Supervisor',
    3: 'Operator'
  };

  getUserName(userId: number): string {
    return this.userMap[userId] || `User-${userId}`;
  }


  setShiftByTime() {
    const hour = new Date().getHours();
    if (hour >= 9 && hour < 18) this.productionForm.patchValue({ shift: 'G' });
    else if (hour < 14) this.productionForm.patchValue({ shift: '1' });
    else if (hour < 22) this.productionForm.patchValue({ shift: '2' });
    else this.productionForm.patchValue({ shift: '3' });
  }

  openForm() {
    this.showForm = true;
    this.editId = null;
    this.productionForm.reset({ productionDate: new Date().toISOString().substring(0, 10) });
    this.setShiftByTime();
  }

  submit() {
    const payload = {
      ...this.productionForm.value,
      totalSolid: this.calculateTotalSolid()
    };

    const req$ = this.editId
      ? this.service.update(this.editId, payload)
      : this.service.save(payload);

    req$.subscribe(() => {
      this.showForm = false;
      this.loadData();
    });
  }

  edit(row: any) {
    this.editId = row.id;
    this.showForm = true;
    this.productionForm.patchValue(row);
  }

  delete(id: number) {
    if (confirm('Delete this production entry?')) {
      this.service.delete(id).subscribe(() => this.loadData());
    }
  }

  // enableModalEdit = false;

  getApprovalLevels(p: any) {
    return {
      checkedBy: {
        name: p?.approvedByL1 || '',
        level: p?.approvedByL1 ? 'L1' : 'L1'
      },
      reviewedBy: {
        name: p?.approvedByL2 || '',
        level: p?.approvedByL2 ? 'L2' : ''
      },
      approvedBy: {
        name: p?.approvedByL3 || '',
        level: p?.approvedByL3 ? 'L3' : ''
      }
    };
  }


  private buildExportRows(p: any): any[] {
    return this.productionFieldConfig.map(f => {
      let value = p?.[f.key];

      if (f.format === 'date' && value) {
        value = this.formatDate(value);
      }

      return [
        f.label,
        value !== null && value !== undefined && value !== '' ? value : ''
      ];
    });
  }

  private productionFieldConfig = [
    { label: 'Batch No', key: 'batchNo' },
    { label: 'Date', key: 'createdDate', format: 'date' },
    { label: 'Shift', key: 'shift' },

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
    { label: 'AI Power gm', key: 'aiPowerGm' },

    { label: 'Temperature (°C)', key: 'tempC' },
    { label: 'Casting Time', key: 'castingTime' },
    { label: 'Production Time', key: 'productionTime' },

    { label: 'Production Remark', key: 'productionRemark' },
    { label: 'Remark', key: 'remark' },

    { label: 'Approval Stage', key: 'approvalStage' },
    { label: 'Approved By L1', key: 'approvedByL1' },
    { label: 'Approved By L2', key: 'approvedByL2' },
    { label: 'Approved By L3', key: 'approvedByL3' }
    // { label: 'Approved By L4', key: 'approvedByL4' },
    // { label: 'Approved By L5', key: 'approvedByL5' },
    // { label: 'Approved By L6', key: 'approvedByL6' },
    // { label: 'Approved By L7', key: 'approvedByL7' }
  ];


  downloadProduction() {
    const p = this.selectedProduction;
    if (!p) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Production Register', 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [['Field', 'Value']],
      body: this.buildExportRows(p),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 120 }
      }
    });

    doc.save(`Production-${p.batchNo}.pdf`);
  }


  canApprove(p: any): boolean {
    if (!p) return false;

    const stage = p.approvalStage || 'NONE';

    return (
      (this.currentUserRole === 'ROLE_L1' && stage === 'NONE') ||
      (this.currentUserRole === 'ROLE_L2' && stage === 'L1') ||
      (this.currentUserRole === 'ROLE_L3' && stage === 'L2')
    );
  }


  canReject(p: any): boolean {
    if (!p) return false;

    const stage = p.approvalStage;

    if (stage === 'L3') return false; // final approved cannot reject

    return (
      (this.currentUserRole === 'ROLE_L1' && stage === 'NONE') ||
      (this.currentUserRole === 'ROLE_L2' && stage === 'L1') ||
      (this.currentUserRole === 'ROLE_L3' && stage === 'L2')
    );
  }


  canEditDelete(): boolean {
    return (
      this.currentUserRole === 'ROLE_ADMIN' ||
      this.currentUserRole === 'ROLE_L1'
    );
  }

  approveProduction() {
    if (!this.selectedProduction) return;

    this.service.approve(this.selectedProduction.id).subscribe({
      next: () => {
        alert('Approved successfully');
        this.closeModal();
        this.loadData();
      },
      error: () => alert('Approve failed')
    });
  }


  rejectProduction() {
    if (!this.selectedProduction) return;

    const reason = prompt('Enter rejection reason');
    if (!reason) return;

    this.service.reject(this.selectedProduction.id, reason).subscribe({
      next: () => {
        alert('Rejected successfully');
        this.closeModal();
        this.loadData();
      },
      error: () => alert('Reject failed')
    });
  }

  // saveModalEdit() {
  //   if (!this.selectedProduction) return;

  //   this.service.update(
  //     this.selectedProduction.id,
  //     this.selectedProduction
  //   ).subscribe({
  //     next: () => {
  //       alert('Updated successfully');
  //       this.enableModalEdit = false;
  //       this.loadData();
  //     },
  //     error: () => alert('Update failed')
  //   });
  // }
  closeModal() {
    const modalEl = document.getElementById('productionModal');
    if (!modalEl) return;

    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    modalInstance?.hide();
  }



  canViewProduction(p: any): boolean {
    if (!p) return false;

    const stage = p.approvalStage || 'NONE';

    switch (this.currentUserRole) {

      case 'ROLE_L1':
        // ✅ pending + rejected
        return stage === 'NONE';

      case 'ROLE_L2':
        // ✅ only L1 approved
        return stage === 'L1';

      case 'ROLE_L3':
        // ✅ L2 approved + final approved
        return stage === 'L2' || stage === 'L3';

      case 'ROLE_ADMIN':
        return true;

      default:
        return false;
    }
  }

  importExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // 🔥 Read ALL rows as-is
      const rows = XLSX.utils.sheet_to_json<any>(sheet, {
        defval: '' // important → do not skip empty cells
      });

      if (!rows.length) {
        alert('Excel file is empty');
        return;
      }

      // 🔥 Extract ALL column headers dynamically
      this.excelHeaders = Object.keys(rows[0]);

      // 🔥 Store ALL rows (no filtering)
      this.excelRows = rows.map(r => ({
        ...r,
        importStatus: 'PENDING',
        errorMessage: ''
      }));

      this.showImportModal = true;
    };

    reader.readAsBinaryString(file);
  }


  normalizeRow(row: any) {
    const obj: any = {};
    Object.keys(row).forEach(k => {
      const key = k.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
      obj[key] = row[k];
    });
    return obj;
  }
  formatExcelDate(value: any): string | null {
    if (!value) return null;

    if (typeof value === 'number') {
      const d = XLSX.SSF.parse_date_code(value);
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    }

    if (typeof value === 'string' && value.includes('/')) {
      const [d, m, y] = value.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return value;
  }
  saveExcelToDB() {
    const payload = {
      productions: this.excelRows.map(r => ({
        shift: r['Shift'],
        siloNo1: r['Silo No 1'],
        literWeight1: Number(r['Liter Weight 1'] || 0),
        faSolid1: Number(r['FA Solid 1'] || 0),

        siloNo2: r['Silo No 2'],
        literWeight2: Number(r['Liter Weight 2'] || 0),
        faSolid2: Number(r['FA Solid 2'] || 0),

        waterLiter: Number(r['Water Liter'] || 0),
        cementKg: Number(r['Cement Kg'] || 0),
        limeKg: Number(r['Lime Kg'] || 0),
        gypsumKg: Number(r['Gypsum Kg'] || 0),
        solOilKg: Number(r['Sol Oil Kg'] || 0),
        aiPowerGm: Number(r['AI Power gm'] || 0),
        tempC: Number(r['Temperature (°C)'] || 0),

        castingTime: r['Casting Time'],
        productionTime: r['Production Time'],
        productionRemark: r['Production Remark'],
        remark: r['Remark']
      })),
      uploadedBy: 1,
      branchId: 1,
      orgId: 1
    };

    this.service.importProduction(payload).subscribe(res => {

      this.excelRows.forEach((row, index) => {
        row.importStatus = res.results[index]?.status;
        row.errorMessage = res.results[index]?.error || '';
      });

      this.apiMessage =
        `${res.savedCount} saved, ${res.errorCount} failed`;

      /* 🔥 ADD THESE 3 LINES */
      this.showImportModal = false;   // close modal
      this.loadData();               // reload list
      this.currentPage = 1;          // reset pagination
    });
  }




  clearExcelPreview() {
    this.excelPreview = [];
    this.hasExcelErrors = false;
    this.apiMessage = '';
    this.showImportModal = false;   // 🔥 VERY IMPORTANT
  }

  onImportSelect(event: any, fileInput: HTMLInputElement) {
    if (event.target.value === 'excel') fileInput.click();
    event.target.value = '';
  }

}
