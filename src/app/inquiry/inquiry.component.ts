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

  showInquiries = false;

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
      inqStatusId: ['', Validators.required],
      inqueryDate: [today, Validators.required],

      leadAccountId: ['', Validators.required],
      projectCode: ['', Validators.required],
      unitCode: ['', Validators.required],

      particulars: [''],
      rate: [0, Validators.required],
      quantity: [1, Validators.required],
      total: [0],

      orgId: [0],
      branchId: [0],
      userId: [0],

      isActive: [1]
    });

    this.loadLeads();
    this.loadProjects();
    this.loadInquiries();
    this.calculateTotal();
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
    this.inquiryService.getAll().subscribe(res => this.inquiries = res);
  }

  calculateTotal() {
    this.form.valueChanges.subscribe(v => {
      const total = (v.rate || 0) * (v.quantity || 0);
      this.form.patchValue({ total }, { emitEvent: false });
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.inquiryService.create(this.form.value).subscribe({
      next: () => {
        alert('✅ Inquiry Saved Successfully');
        this.form.reset({ isActive: 1 });
        this.loadInquiries();
        this.loading = false;
      },
      error: () => {
        alert('❌ Failed to save inquiry');
        this.loading = false;
      }
    });
  }

  getLeadName(leadId: number): string {
    if (!leadId || !this.leads?.length) return '-';

    const lead = this.leads.find(l => l.leadId === leadId);
    return lead?.cName || '-';
  }

  getProjectName(projectId: number): string {
    if (!projectId || !this.projects?.length) return '-';

    const project = this.projects.find(p => p.projectId === projectId);
    return project?.projectName || '-';
  }

}
