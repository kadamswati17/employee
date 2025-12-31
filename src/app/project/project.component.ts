import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../services/project.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  showProjects = false;
  projects: any[] = [];
  filteredProjects: any[] = [];

  isEditMode = false;
  editProjectId: number | null = null;

  filterFromDate = '';
  filterToDate = '';
  filterStatus = '';

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 0;
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      projectName: ['', Validators.required],
      sanctionDate: [today, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      srvGutNo: [''],
      previousLandOwner: [''],
      landOwner: [''],
      builderName: [''],
      reraNo: [0],
      address: [''],
      budgetAmt: ['', Validators.required],
      orgId: [0],
      branchId: [0],
      userId: [{ value: userId, disabled: true }],
      isActive: [1]
    });
  }

  toggleProjects() {
    this.showProjects = !this.showProjects;
    if (this.showProjects) this.loadProjects();
  }

  loadProjects() {
    this.projectService.getAll().subscribe({
      next: res => {
        this.projects = res;
        this.filteredProjects = [...res];
      },
      error: () => alert('Failed to load projects')
    });
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
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;

    const payload = {
      ...this.form.getRawValue(),
      projectId: this.editProjectId
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
    this.isEditMode = false;
    this.editProjectId = null;
    this.loading = false;
    this.showProjects = true;
    this.loadProjects();
  }

  applyFilters() {

    // ❌ Invalid range guard
    if (
      this.filterFromDate &&
      this.filterToDate &&
      new Date(this.filterToDate) < new Date(this.filterFromDate)
    ) {
      alert('To Date cannot be earlier than From Date');
      return;
    }

    const fromDate = this.filterFromDate
      ? new Date(this.filterFromDate).getTime()
      : null;

    // include full day for To Date
    const toDate = this.filterToDate
      ? new Date(this.filterToDate + 'T23:59:59').getTime()
      : null;

    this.filteredProjects = this.projects.filter(p => {

      const projectStart = new Date(p.startDate).getTime();
      const projectEnd = new Date(p.endDate).getTime();

      // ✅ STRICT RANGE CHECK (THIS IS THE FIX)
      const dateOk =
        (!fromDate || projectStart >= fromDate) &&
        (!toDate || projectEnd <= toDate);

      const statusOk =
        this.filterStatus !== ''
          ? String(p.isActive) === this.filterStatus
          : true;

      return dateOk && statusOk;
    });
  }



  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterStatus = '';
    this.filteredProjects = [...this.projects];
  }
}
