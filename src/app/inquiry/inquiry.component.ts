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

  showInquiries = false;
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

    this.filterFromDate = today;
    this.filterToDate = today;

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
      this.applyFilters();
    });
  }

  // ✅ FIXED EDIT METHOD (THIS IS THE KEY)
  editInquiry(i: any) {
    this.isEditMode = true;

    // ✅ FIXED ID
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      ? new Date(this.filterFromDate).setHours(0, 0, 0, 0)
      : null;

    const to = this.filterToDate
      ? new Date(this.filterToDate).setHours(23, 59, 59, 999)
      : null;

    this.filteredInquiries = this.inquiries.filter(i => {
      const d = new Date(i.inqueryDate).getTime();

      const dateOk = (!from || d >= from) && (!to || d <= to);
      const activeOk = this.filterStatus !== '' ? String(i.isActive) === this.filterStatus : true;
      const inquiryOk = this.filterInquiryStatus !== '' ? String(i.inqStatusId) === this.filterInquiryStatus : true;

      return dateOk && activeOk && inquiryOk;
    });
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterStatus = '';
    this.filterInquiryStatus = '';
    this.applyFilters();
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
