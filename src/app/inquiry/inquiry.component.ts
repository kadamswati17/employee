import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InquiryService } from '../services/inquiry.service';
import { LeadService } from '../services/lead.service';
import { ProjectService } from '../services/project.service';

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

  // ✅ PAGINATION
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedInquiries: any[] = [];

  showInquiries = true;
  isEditMode = false;
  editInquiryId: number | null = null;

  // FILTERS
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

    // auto calculate total
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
      this.filteredInquiries = [...res];
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
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedInquiries = this.filteredInquiries.slice(start, end);
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

  /* ================= FILTER ================= */

  applyFilters() {
    const from = this.filterFromDate ? new Date(this.filterFromDate).getTime() : null;
    const to = this.filterToDate ? new Date(this.filterToDate + 'T23:59:59').getTime() : null;

    this.filteredInquiries = this.inquiries.filter(i => {
      const d = new Date(i.inqueryDate).getTime();
      const dateOk = (!from || d >= from) && (!to || d <= to);
      const activeOk = this.filterStatus !== '' ? String(i.isActive) === this.filterStatus : true;
      const inquiryOk = this.filterInquiryStatus !== '' ? String(i.inqStatusId) === this.filterInquiryStatus : true;
      return dateOk && activeOk && inquiryOk;
    });

    this.setupPagination();
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterStatus = '';
    this.filterInquiryStatus = '';
    this.filteredInquiries = [...this.inquiries];
    this.setupPagination();
  }

  getLeadName(id: number) {
    return this.leads.find(l => l.leadId === id)?.cname ?? '-';
  }

  getProjectName(id: number) {
    return this.projects.find(p => p.projectId === id)?.projectName ?? '-';
  }

  getInquiryStatusName(id: number): string {
    return this.statusList.find(s => s.id === id)?.name ?? '-';
  }
}
