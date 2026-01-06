import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../services/project.service';
import { AuthService } from '../services/auth.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  showProjects = true;
  projects: any[] = [];
  filteredProjects: any[] = [];

  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedProjects: any[] = [];

  isEditMode = false;
  editProjectId: number | null = null;

  filterFromDate = '';
  filterToDate = '';
  filterStatus = '';

  excelPreview: any[] = [];
  hasExcelErrors = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 0;

    const today = new Date().toISOString().split('T')[0];

    this.filterFromDate = today;
    this.filterToDate = today;

    this.form = this.fb.group({
      projectName: ['', Validators.required],
      sanctionDate: [today, Validators.required],
      startDate: [today, Validators.required],
      endDate: [today, Validators.required],
      srvGutNo: [''],
      previousLandOwner: [''],
      landOwner: [''],
      builderName: [''],
      reraNo: [0],
      address: [''],
      budgetAmt: ['', Validators.required],
      orgId: [0],
      branchId: [0],
      userId: [userId, Validators.required],
      isActive: [1]
    });

    this.loadProjects();
  }

  // ================= SCROLL FIX =================
  scrollToTop() {
    const container = document.querySelector('.project-wrapper');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }


  // ================= DATE HELPERS =================

  private formatDate(date: any): string {
    return new Date(date).toISOString().split('T')[0];
  }

  private excelDateToISO(value: any): string {
    if (typeof value === 'number') {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    return new Date(value).toISOString().split('T')[0];
  }

  // ================= PROJECT LIST =================

  loadProjects() {
    this.projectService.getAll().subscribe({
      next: res => {
        this.projects = res;

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        ).getTime();

        this.filteredProjects = this.projects.filter(p => {
          const d = new Date(p.startDate).getTime();
          return d >= start && d <= end;
        });

        this.setupPagination();
      },
      error: () => alert('Failed to load projects')
    });
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.filteredProjects.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const sorted = [...this.filteredProjects]
      .sort((a, b) => b.projectId - a.projectId);

    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedProjects = sorted.slice(start, start + this.pageSize);
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

  openCreateForm() {
    this.isEditMode = false;
    this.editProjectId = null;
    this.showProjects = false;
    this.scrollToTop(); // ✅ FIX
  }

  backToList() {
    this.showProjects = true;
    this.scrollToTop(); // ✅ FIX
  }

  editProject(project: any) {
    this.isEditMode = true;
    this.editProjectId = project.projectId;
    this.showProjects = false;

    this.form.patchValue({
      projectName: project.projectName,
      sanctionDate: project.sanctionDate?.split('T')[0],
      startDate: project.startDate?.split('T')[0],
      endDate: project.endDate?.split('T')[0],
      srvGutNo: project.srvGutNo,
      previousLandOwner: project.previousLandOwner,
      landOwner: project.landOwner,
      builderName: project.builderName,
      reraNo: project.reraNo,
      address: project.address,
      budgetAmt: project.budgetAmt,
      isActive: project.isActive
    });

    this.scrollToTop(); // ✅ FIX
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;

    const payload = {
      ...this.form.getRawValue(),
      sanctionDate: this.formatDate(this.form.value.sanctionDate),
      startDate: this.formatDate(this.form.value.startDate),
      endDate: this.formatDate(this.form.value.endDate),
      projectId: this.editProjectId,
      userId: this.authService.getCurrentUser()?.id
    };

    if (this.isEditMode && this.editProjectId) {
      this.projectService.update(this.editProjectId, payload).subscribe(() => {
        alert('Project updated');
        this.resetForm();
      });
    } else {
      this.projectService.create(payload).subscribe(() => {
        alert('Project created');
        this.resetForm();
      });
    }
  }

  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    this.form.reset({ sanctionDate: today, isActive: 1 });
    this.loading = false;
    this.isEditMode = false;
    this.showProjects = true;
    this.loadProjects();
  }

  // ================= FILTERS =================

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

    this.filteredProjects = this.projects.filter(p => {
      const s = new Date(p.startDate).getTime();
      const e = new Date(p.endDate).getTime();

      const dateOk = (!from || s >= from) && (!to || e <= to);
      const statusOk =
        this.filterStatus !== ''
          ? String(p.isActive) === this.filterStatus
          : true;

      return dateOk && statusOk;
    });

    this.setupPagination();
  }

  clearFilters() {
    const today = new Date().toISOString().split('T')[0];
    this.filterFromDate = today;
    this.filterToDate = today;
    this.filterStatus = '';
    this.filteredProjects = [...this.projects];
    this.setupPagination();
  }

  // ================= EXPORT =================

  exportData(type: string) {
    if (type === 'pdf') this.exportPDF();
    if (type === 'excel') this.exportExcel();
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.text('Project List', 14, 15);

    autoTable(doc, {
      head: [['#', 'Project Name', 'Start', 'End', 'Budget', 'Status']],
      body: this.filteredProjects.map((p, i) => [
        i + 1,
        p.projectName,
        new Date(p.startDate).toLocaleDateString(),
        new Date(p.endDate).toLocaleDateString(),
        p.budgetAmt,
        p.isActive ? 'Active' : 'Inactive'
      ]),
      startY: 20
    });

    doc.save('projects.pdf');
  }

  exportExcel() {
    const data = this.filteredProjects.map((p, i) => ({
      'Sr No': i + 1,
      'Project Name': p.projectName,
      'Start Date': new Date(p.startDate).toLocaleDateString(),
      'End Date': new Date(p.endDate).toLocaleDateString(),
      'Budget': p.budgetAmt,
      'Status': p.isActive ? 'Active' : 'Inactive'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, 'projects.xlsx');
  }

  // ================= EXCEL IMPORT =================

  importExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);
      this.validateExcel(rows);
    };
    reader.readAsArrayBuffer(file);
  }

  validateExcel(rows: any[]) {
    this.excelPreview = [];
    this.hasExcelErrors = false;

    rows.forEach(r => {
      const errors: string[] = [];

      if (!r['Project Name']) errors.push('Project Name required');
      if (!r['Start Date']) errors.push('Start Date required');
      if (!r['End Date']) errors.push('End Date required');
      if (isNaN(r['Budget'])) errors.push('Invalid Budget');
      if (!['Active', 'Inactive'].includes(r['Status']))
        errors.push('Status must be Active or Inactive');

      if (errors.length) this.hasExcelErrors = true;

      this.excelPreview.push({
        projectName: r['Project Name'],
        startDate: this.excelDateToISO(r['Start Date']),
        endDate: this.excelDateToISO(r['End Date']),
        budgetAmt: Number(r['Budget']),
        isActive: r['Status'] === 'Active' ? 1 : 0,
        _errors: errors
      });
    });
  }

  saveExcelToDB() {
    const validRows = this.excelPreview.filter(r => !r._errors.length);

    validRows.forEach(r => {
      this.projectService.create({
        projectName: r.projectName,
        sanctionDate: r.startDate,
        startDate: r.startDate,
        endDate: r.endDate,
        budgetAmt: r.budgetAmt,
        isActive: r.isActive,
        orgId: 0,
        branchId: 0,
        userId: this.authService.getCurrentUser()?.id
      }).subscribe();
    });

    alert('Excel projects imported successfully');
    this.excelPreview = [];
    this.loadProjects();
  }

  clearExcelPreview() {
    this.excelPreview = [];
    this.hasExcelErrors = false;
  }

  onImportSelect(event: any, fileInput: HTMLInputElement) {
    if (event.target.value === 'excel') {
      fileInput.click();
    }
    event.target.value = '';
  }
}
