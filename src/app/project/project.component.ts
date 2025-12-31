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

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    const currentUser = this.authService.getCurrentUser();
    const userId = currentUser?.id || 0;

    this.form = this.fb.group({
      projectName: ['', Validators.required],
      sanctionDate: ['', Validators.required],
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

  // ================= TOGGLE PROJECT LIST =================
  toggleProjects() {
    this.showProjects = !this.showProjects;

    if (this.showProjects) {
      this.loadProjects();
    }
  }

  // ================= LOAD PROJECTS =================
  loadProjects() {
    this.projectService.getAll().subscribe({
      next: (res) => this.projects = res,
      error: () => alert('❌ Failed to load project list')
    });
  }

  // ================= SAVE PROJECT =================
  submit(): void {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const payload = this.form.getRawValue(); // includes userId

    this.projectService.create(payload).subscribe({
      next: () => {
        alert('✅ Project Created Successfully');
        this.form.reset({ isActive: 1 });
        this.loading = false;

        if (this.showProjects) {
          this.loadProjects();
        }
      },
      error: () => {
        alert('❌ Failed to save project');
        this.loading = false;
      }
    });
  }
}
