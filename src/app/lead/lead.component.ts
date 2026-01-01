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

  leads: any[] = [];
  filteredLeads: any[] = [];

  showLeads = true;
  isEditMode = false;
  editLeadId: number | null = null;

  /* ================= FILTERS ================= */
  filterFromDate = '';
  filterToDate = '';
  filterStatus = '';

  /* ================= PAGINATION ================= */
  currentPage = 1;
  pageSize = 5;
  totalPages = 0;
  paginatedLeads: any[] = [];

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

      userId: [1],
      branchId: [1],
      orgId: [1],
      isActive: [1]
    });

    this.loadStates();
    this.loadLeads();
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

  loadLeads() {
    this.leadService.getAll().subscribe(res => {
      this.leads = res;
      this.filteredLeads = [...res];
      this.setupPagination();
    });
  }

  /* ================= FILTER LOGIC ================= */

  applyFilters() {

    // ❌ To Date cannot be less than From Date
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

    this.filteredLeads = this.leads.filter(l => {

      const leadDate = new Date(l.date).getTime();

      const dateOk =
        (!from || leadDate >= from) &&
        (!to || leadDate <= to); // ✅ equal & greater allowed

      const statusOk =
        this.filterStatus !== ''
          ? String(l.isActive) === this.filterStatus
          : true;

      return dateOk && statusOk;
    });

    this.setupPagination();
  }

  clearFilters() {
    this.filterFromDate = '';
    this.filterToDate = '';
    this.filterStatus = '';
    this.filteredLeads = [...this.leads];
    this.setupPagination();
  }

  /* ================= PAGINATION ================= */

  setupPagination() {
    this.totalPages = Math.ceil(this.filteredLeads.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLeads = this.filteredLeads.slice(start, end);
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

  /* ================= UI ACTIONS ================= */

  openCreate() {
    this.isEditMode = false;
    this.editLeadId = null;
    this.form.reset({
      date: new Date().toISOString().split('T')[0],
      isActive: 1,
      userId: 1,
      branchId: 1,
      orgId: 1
    });
    this.showLeads = false;
  }

  backToList() {
    this.showLeads = true;
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
      gstNo: lead.gstNo,
      email: lead.email,
      website: lead.website,
      phone: lead.phone,
      fax: lead.fax,
      invoiceAddress: lead.invoiceAddress,
      income: lead.income,
      incomeSource: lead.incomeSource,
      otherIncome: lead.otherIncome,
      otherIncomeSource: lead.otherIncomeSource,
      budget: lead.budget,
      notes: lead.notes,
      area: lead.area,
      stateId: lead.stateId,
      distId: lead.distId,
      cityId: lead.cityId,
      isActive: lead.isActive,
      userId: lead.userId ?? 1,
      branchId: lead.branchId ?? 1,
      orgId: lead.orgId ?? 1
    });

    this.onStateChange();
    this.onDistrictChange();
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;

    const payload = {
      ...this.form.value,
      cname: this.form.value.cName,
      leadId: this.editLeadId
    };

    const req = this.isEditMode && this.editLeadId
      ? this.leadService.update(this.editLeadId, payload)
      : this.leadService.create(payload);

    req.subscribe({
      next: () => {
        alert(this.isEditMode ? 'Lead Updated' : 'Lead Created');
        this.loading = false;
        this.showLeads = true;
        this.loadLeads();
      },
      error: (err) => {
        this.loading = false;
        alert(err.error || 'Failed to save lead');
      }
    });
  }
}
