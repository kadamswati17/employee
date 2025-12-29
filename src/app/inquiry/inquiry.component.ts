import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InquiryService } from '../services/inquiry.service';

@Component({
  selector: 'app-inquiry',
  templateUrl: './inquiry.component.html',
  styleUrls: ['./inquiry.component.css']
})
export class InquiryComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private service: InquiryService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({
      inqStatusId: [1, Validators.required],
      inqueryDate: ['', Validators.required],

      leadAccountId: ['', Validators.required],
      projectCode: ['', Validators.required],
      unitCode: ['', Validators.required],

      particulars: [''],
      rate: [0, Validators.required],
      quantity: [1, Validators.required],
      amount: [0],
      total: [0],

      orgId: [0],
      branchId: [0],
      userId: [0],

      isActive: [1]
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;

    this.service.create(this.form.value).subscribe({
      next: () => {
        alert('✅ Inquiry Saved Successfully');
        this.form.reset({ isActive: 1 });
        this.loading = false;
      },
      error: () => {
        alert('❌ Failed to save inquiry');
        this.loading = false;
      }
    });
  }
}
