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
  filteredLeads: any[] = [];

  isEditMode = false;
  editLeadId: number | null = null;

  // ✅ FIX: MISSING VARIABLE
  filterStatus: string = '';

  filterFromDate = '';
  filterToDate = '';

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
      contactNo: ['', Validators.required],
      panNo: ['', [Validators.required, this.panValidator]],
      budget: ['', Validators.required],
      stateId: [null, Validators.required],
      distId: [null, Validators.required],
      cityId: [null, Validators.required],
      isActive: [1]
    });

    // default filter dates = today
    this.filterFromDate = today;
    this.filterToDate = today;

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
    if (!stateId) return;

    this.districts = [];
    this.cities = [];
    this.form.patchValue({ distId: null, cityId: null });

    this.locationService.getDistricts(stateId)
      .subscribe(res => this.districts = res);
  }

  onDistrictChange() {
    const distId = this.form.value.distId;
    if (!distId) return;

    this.cities = [];
    this.form.patchValue({ cityId: null });

    this.locationService.getCities(distId)
      .subscribe(res => this.cities = res);
  }

  toggleLeads() {
    this.showLeads = !this.showLeads;
    if (this.showLeads) this.loadLeads();
  }

  loadLeads() {
    this.leadService.getAll().subscribe(res => {
      this.leads = res;
      this.filteredLeads = [...res];
      this.applyFilters(); // apply default today filter
    });
  }

  editLead(lead: any) {

    this.isEditMode = true;
    this.editLeadId = lead.leadId;
    this.showLeads = false;

    this.form.patchValue({
      date: lead.date?.split('T')[0],
      cName: lead.cname,
      contactNo: lead.contactNo,
      panNo: lead.panNo,
      budget: lead.budget,
      stateId: lead.stateId,
      distId: lead.distId,
      cityId: lead.cityId,
      isActive: lead.isActive
    });

    this.locationService.getDistricts(lead.stateId).subscribe(d => {
      this.districts = d;
      this.locationService.getCities(lead.distId).subscribe(c => {
        this.cities = c;
      });
    });
  }

  submit() {

    if (this.form.invalid) return;
    this.loading = true;

    const payload = {
      ...this.form.value,
      leadId: this.editLeadId
    };

    if (this.isEditMode && this.editLeadId) {
      this.leadService.update(this.editLeadId, payload).subscribe(() => {
        alert('Lead Updated');
        this.resetForm();
      });
    } else {
      this.leadService.create(payload).subscribe(() => {
        alert('Lead Created');
        this.resetForm();
      });
    }
  }

  resetForm() {
    this.form.reset({
      date: new Date().toISOString().split('T')[0],
      isActive: 1
    });

    this.isEditMode = false;
    this.editLeadId = null;
    this.loading = false;
    this.showLeads = true;

    this.loadLeads();
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
      ? new Date(this.filterFromDate).setHours(0, 0, 0, 0)
      : null;

    // ✅ include full day for To Date
    const toDate = this.filterToDate
      ? new Date(this.filterToDate).setHours(23, 59, 59, 999)
      : null;

    this.filteredLeads = this.leads.filter(l => {

      const leadDate = new Date(l.date).getTime();

      // ✅ STRICT RANGE CHECK (NO OVERLAP)
      const dateOk =
        (!fromDate || leadDate >= fromDate) &&
        (!toDate || leadDate <= toDate);

      const statusOk =
        this.filterStatus !== ''
          ? String(l.isActive) === this.filterStatus
          : true;

      return dateOk && statusOk;
    });
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterStatus = '';
    this.filteredLeads = [...this.leads];
  }


}
