import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeadService } from '../services/lead.service';
import { LocationService } from '../services/LocationService';

@Component({
  selector: 'app-lead',
  templateUrl: './lead.component.html',
  styleUrls: ['./lead.component.css']
})
export class LeadComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  states: any[] = [];
  districts: any[] = [];
  cities: any[] = [];

  showLeads = false;
  leads: any[] = [];

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private locationService: LocationService
  ) { }

  ngOnInit(): void {

    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      date: [today],
      cName: ['', Validators.required],
      contactNo: [null, Validators.required],
      panNo: ['', [Validators.required, this.panValidator]],
      gstNo: [''],
      email: ['', Validators.email],
      website: [''],
      phone: [null],
      fax: [null],
      invoiceAddress: [''],
      income: [null],
      incomeSource: [''],
      otherIncome: [null],
      otherIncomeSource: [''],
      budget: [null, Validators.required],
      notes: [''],
      area: [''],
      stateId: [null, Validators.required],
      distId: [null, Validators.required],
      cityId: [null, Validators.required],
      userId: [0],
      branchId: [0],
      orgId: [0],
      isActive: [1]
    });

    this.loadStates();
  }

  panValidator(control: any) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    return control.value && !panRegex.test(control.value)
      ? { invalidPan: true }
      : null;
  }

  loadStates() {
    this.locationService.getStates().subscribe(res => this.states = res);
  }

  onStateChange() {
    const stateId = this.form.value.stateId;
    this.districts = [];
    this.cities = [];
    this.form.patchValue({ distId: null, cityId: null });

    this.locationService.getDistricts(stateId).subscribe(res => this.districts = res);
  }

  onDistrictChange() {
    const districtId = this.form.value.distId;
    this.cities = [];
    this.form.patchValue({ cityId: null });

    this.locationService.getCities(districtId).subscribe(res => this.cities = res);
  }

  toggleLeads() {
    this.showLeads = !this.showLeads;
    if (this.showLeads) this.loadLeads();
  }

  loadLeads() {
    this.leadService.getAll().subscribe({
      next: (res) => this.leads = res,
      error: () => alert('❌ Failed to load leads')
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.leadService.create(this.form.value).subscribe({
      next: () => {
        alert('✅ Lead Saved Successfully');
        this.form.reset({ isActive: 1, date: new Date().toISOString().split('T')[0] });
        this.loading = false;
        if (this.showLeads) this.loadLeads();
      },
      error: (err) => {
        this.loading = false;
        if (err.error === 'PAN number already exists') {
          this.form.get('panNo')?.setErrors({ duplicate: true });
        } else {
          alert(err.error || '❌ Failed to save lead');
        }
      }
    });
  }
}
