import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InquiryService } from '../services/inquiry.service';
import { LeadService } from '../services/lead.service';
import { ProjectService } from '../services/project.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-inquiry',
  templateUrl: './inquiry.component.html',
  styleUrls: ['./inquiry.component.css']
})
export class InquiryComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  leads: any[] = [];
  projects: any[] = [];
  inquiries: any[] = [];
  filteredInquiries: any[] = [];

  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedInquiries: any[] = [];

  excelPreview: any[] = [];
  hasExcelErrors = false;


  showInquiries = true;
  isEditMode = false;
  editInquiryId: number | null = null;

  filterFromDate = '';
  filterToDate = '';
  filterStatus = '';
  filterInquiryStatus = '';

  statusList = [
    { id: 1, name: 'Open' },
    { id: 2, name: 'In Progress' },
    { id: 3, name: 'Closed' },
    { id: 4, name: 'Success' },
    { id: 5, name: 'Cancelled' }
  ];

  constructor(
    private fb: FormBuilder,
    private inquiryService: InquiryService,
    private leadService: LeadService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {

    const today = new Date().toISOString().split('T')[0];
    this.filterFromDate = today;
    this.filterToDate = today;
    this.form = this.fb.group({
      inqueryDate: [today, Validators.required],
      inqStatusId: ['', Validators.required],
      leadAccountId: ['', Validators.required],
      projectCode: ['', Validators.required],
      unitCode: ['', Validators.required],
      rate: [0, Validators.required],
      quantity: [1, Validators.required],
      total: [0],
      particulars: [''],
      isActive: [1]
    });

    this.loadLeads();
    this.loadProjects();
    this.loadInquiries();

    this.form.valueChanges.subscribe(v => {
      this.form.patchValue(
        { total: (v.rate || 0) * (v.quantity || 0) },
        { emitEvent: false }
      );
    });
  }

  toggleInquiries() {
    this.showInquiries = !this.showInquiries;
  }

  loadLeads() {
    this.leadService.getAll().subscribe(res => this.leads = res);
  }

  loadProjects() {
    this.projectService.getAll().subscribe(res => this.projects = res);
  }

  loadInquiries() {
    this.inquiryService.getAll().subscribe(res => {
      this.inquiries = res;

      // ✅ DEFAULT CURRENT MONTH
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

      this.filteredInquiries = this.inquiries.filter(i => {
        const d = new Date(i.inqueryDate).getTime();
        return d >= start && d <= end;
      });

      this.setupPagination();
    });
  }

  /* ================= PAGINATION ================= */

  setupPagination() {
    this.totalPages = Math.ceil(this.filteredInquiries.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const sorted = [...this.filteredInquiries]
      .sort((a, b) => b.inqueryId - a.inqueryId); // 🔥 DESC by ID

    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedInquiries = sorted.slice(start, start + this.pageSize);
  }


  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  /* ================= FILTER ================= */

  applyFilters() {
    const from = this.filterFromDate ? new Date(this.filterFromDate).getTime() : null;
    const to = this.filterToDate ? new Date(this.filterToDate + 'T23:59:59').getTime() : null;

    if (
      this.filterFromDate &&
      this.filterToDate &&
      new Date(this.filterToDate) < new Date(this.filterFromDate)
    ) {
      alert('To Date cannot be earlier than From Date');
      return;
    }

    this.filteredInquiries = this.inquiries.filter(i => {
      const d = new Date(i.inqueryDate).getTime();
      const dateOk = (!from || d >= from) && (!to || d <= to);
      const activeOk = this.filterStatus !== '' ? String(i.isActive) === this.filterStatus : true;
      const inquiryOk = this.filterInquiryStatus !== '' ? String(i.inqStatusId) === this.filterInquiryStatus : true;
      return dateOk && activeOk && inquiryOk;
    });

    this.setupPagination();
  }



  getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // yyyy-MM-dd
  }



  clearFilters() {
    const today = this.getToday();
    this.filterFromDate = today;   // ✅ today
    this.filterToDate = today;
    this.filterStatus = '';
    this.filterInquiryStatus = '';
    this.filteredInquiries = [...this.inquiries];
    this.setupPagination();
  }

  /* ================= EXPORT ================= */

  exportData(type: string) {
    if (type === 'pdf') this.exportPDF();
    if (type === 'excel') this.exportExcel();
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.text('Inquiry List', 14, 15);

    autoTable(doc, {
      head: [['#', 'Date', 'Lead', 'Project', 'Status', 'Inquiry Status', 'Total']],
      body: this.filteredInquiries.map((i, idx) => [
        idx + 1,
        new Date(i.inqueryDate).toLocaleDateString(),
        this.getLeadName(i.leadAccountId),
        this.getProjectName(i.projectCode),
        i.isActive ? 'Active' : 'Inactive',
        this.getInquiryStatusName(i.inqStatusId),
        i.total
      ]),
      startY: 20
    });

    doc.save('inquiries.pdf');
  }

  exportExcel() {
    const data = this.filteredInquiries.map((i, idx) => ({
      'Sr No': idx + 1,
      'Date': new Date(i.inqueryDate).toLocaleDateString(),
      'Lead': this.getLeadName(i.leadAccountId),
      'Project': this.getProjectName(i.projectCode),
      'Status': i.isActive ? 'Active' : 'Inactive',
      'Inquiry Status': this.getInquiryStatusName(i.inqStatusId),
      'Total': i.total
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inquiries');
    XLSX.writeFile(wb, 'inquiries.xlsx');
  }

  /* ================= CRUD ================= */

  editInquiry(i: any) {
    this.isEditMode = true;
    this.editInquiryId = i.inqueryId;
    this.showInquiries = false;

    this.form.patchValue({
      inqueryDate: i.inqueryDate?.split('T')[0],
      inqStatusId: i.inqStatusId,
      leadAccountId: i.leadAccountId,
      projectCode: i.projectCode,
      unitCode: i.unitCode,
      rate: i.rate,
      quantity: i.quantity,
      total: i.total,
      particulars: i.particulars,
      isActive: i.isActive
    });
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    const payload = { ...this.form.value, inquiryId: this.editInquiryId };

    const req = this.isEditMode
      ? this.inquiryService.update(this.editInquiryId!, payload)
      : this.inquiryService.create(payload);

    req.subscribe(() => {
      alert(this.isEditMode ? 'Inquiry Updated' : 'Inquiry Created');
      this.resetForm();
    });
  }

  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    this.form.reset({ inqueryDate: today, isActive: 1 });
    this.isEditMode = false;
    this.editInquiryId = null;
    this.loading = false;
    this.showInquiries = true;
    this.loadInquiries();
  }

  /* ================= HELPERS ================= */

  getLeadName(id: number) {
    return this.leads.find(l => l.leadId === id)?.cname ?? '-';
  }

  getProjectName(id: number) {
    return this.projects.find(p => p.projectId === id)?.projectName ?? '-';
  }

  getInquiryStatusName(id: number): string {
    return this.statusList.find(s => s.id === id)?.name ?? '-';
  }

  onImportSelect(event: any, fileInput: HTMLInputElement) {
    if (event.target.value === 'excel') {
      fileInput.click();
    }
    event.target.value = '';
  }


  importInquiryExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.excelPreview = [];      // 🔥 reset
    this.hasExcelErrors = false;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames.length) {
        alert('Invalid Excel file');
        return;
      }

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      if (!rows.length) {
        alert('Excel file is empty');
        return;
      }

      this.validateInquiryExcel(rows);
    };

    reader.readAsArrayBuffer(file);
  }




  validateInquiryExcel(rows: any[]) {
    this.excelPreview = [];
    this.hasExcelErrors = false;

    rows.forEach(r => {

      // 🔥 Skip empty rows
      if (!r['Date'] && !r['Lead'] && !r['Project']) {
        return;
      }

      const errors: string[] = [];

      const date = r['Date'];
      const leadName = r['Lead'];
      const projectName = r['Project'];
      const statusText = r['Status']; // Active / Inactive
      const inquiryStatusText = r['Inquiry Status'];

      // Rate & Qty
      const rate = this.parseNumber(r['Rate']);
      const qty = this.parseNumber(r['Qty']);

      const safeRate = isNaN(rate) ? 0 : rate;
      const safeQty = isNaN(qty) ? 1 : qty;

      const total =
        !isNaN(this.parseNumber(r['Total']))
          ? this.parseNumber(r['Total'])
          : safeRate * safeQty;

      // 🔎 FIND LEAD
      const lead = this.leads.find(l =>
        l.cname?.toLowerCase().trim() === String(leadName || '').toLowerCase().trim()
      );

      // 🔎 FIND PROJECT
      const project = this.projects.find(p =>
        p.projectName?.toLowerCase().trim() === String(projectName || '').toLowerCase().trim()
      );

      // 🔎 FIND INQUIRY STATUS
      const inquiryStatus = this.statusList.find(s =>
        s.name.toLowerCase().trim() === String(inquiryStatusText || '').toLowerCase().trim()
      );

      // 🔎 STATUS → isActive
      let isActive = 1;
      if (statusText && statusText.toLowerCase() === 'inactive') {
        isActive = 0;
      }

      // ===== VALIDATIONS =====
      if (!date) errors.push('Date required');

      if (!leadName || leadName === '-') errors.push('Lead required');
      else if (!lead) errors.push('Invalid Lead');

      if (!projectName || projectName === '-') errors.push('Project required');
      else if (!project) errors.push('Invalid Project');

      if (!inquiryStatusText) errors.push('Inquiry Status required');
      else if (!inquiryStatus) errors.push('Invalid Inquiry Status');

      if (errors.length) this.hasExcelErrors = true;

      this.excelPreview.push({
        inqueryDate: this.parseExcelDate(date),
        leadAccountId: lead ? lead.leadId : null,
        projectCode: project ? project.projectId : null,
        inqStatusId: inquiryStatus ? inquiryStatus.id : null,
        rate: safeRate,
        quantity: safeQty,
        total: total,
        isActive: isActive,
        _errors: errors
      });
    });
  }




  saveInquiryExcelToDB() {
    const validRows = this.excelPreview.filter(r => !r._errors.length);

    validRows.forEach(r => {
      this.inquiryService.create({
        inqueryDate: r.inqueryDate,
        leadAccountId: r.leadAccountId,
        projectCode: r.projectCode,
        inqStatusId: r.inqStatusId,

        // REQUIRED BY Inquiry MODEL
        unitCode: 0,
        rate: r.rate,
        quantity: r.quantity,

        amount: r.rate * r.quantity,   // 🔥 REQUIRED
        total: r.total,

        particulars: '',

        // REQUIRED META FIELDS
        userId: 1,
        branchId: 1,
        orgId: 1,

        isActive: r.isActive
      }).subscribe();
    });

    alert('Inquiries imported successfully');
    this.clearExcelPreview();
    this.loadInquiries();
  }


  clearExcelPreview() {
    this.excelPreview = [];
    this.hasExcelErrors = false;
  }

  parseExcelDate(value: any): string {
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    return new Date(value).toISOString().split('T')[0];
  }

  parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return NaN;

    // Remove currency symbols, commas, spaces
    const clean = String(val).replace(/[₹, ]/g, '');
    return Number(clean);
  }


}
