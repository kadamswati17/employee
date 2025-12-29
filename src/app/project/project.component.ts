import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
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
      userId: [0],
      isActive: [1]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.projectService.create(this.form.value).subscribe({
      next: () => {
        alert('✅ Project Created Successfully');
        this.form.reset({ isActive: 1 });
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        alert('❌ Failed to save project');
        this.loading = false;
      }
    });
  }
}
