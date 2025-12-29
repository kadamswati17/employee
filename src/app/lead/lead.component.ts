import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeadService } from '../services/lead.service';

@Component({
  selector: 'app-lead',
  templateUrl: './lead.component.html',
  styleUrls: ['./lead.component.css']
})
export class LeadComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService
  ) { }

  ngOnInit(): void {
    this.form = this.fb.group({

      date: [''],

      cName: ['', Validators.required],
      contactNo: ['', Validators.required],
      panNo: [''],
      gstNo: [''],
      email: ['', Validators.email],
      website: [''],
      phone: [''],
      fax: [''],
      invoiceAddress: [''],

      income: [''],
      incomeSource: [''],
      otherIncome: [''],
      otherIncomeSource: [''],
      budget: ['', Validators.required],
      notes: [''],
      area: [''],

      stateId: ['', Validators.required],
      distId: [''],
      cityId: ['', Validators.required],

      userId: [''],
      branchId: [''],
      orgId: [''],

      isActive: [1]
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;

    this.leadService.create(this.form.value).subscribe({
      next: () => {
        alert('✅ Lead Saved Successfully');
        this.form.reset({ isActive: 1 });
        this.loading = false;
      },
      error: () => {
        alert('❌ Failed to save lead');
        this.loading = false;
      }
    });
  }
}
