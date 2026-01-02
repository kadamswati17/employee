import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeadService } from '../services/lead.service';
import { LocationService } from '../services/LocationService';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  filterFromDate = '';
  filterToDate = '';
  filterStatus = '';

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
      panNo: ['', Validators.required],
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
    const distId = this.form.value.distId;
    this.cities = [];
    this.form.patchValue({ cityId: null });
    this.locationService.getCities(distId).subscribe(res => this.cities = res);
  }

  loadLeads() {
    this.leadService.getAll().subscribe(res => {
      this.leads = res;

      // ✅ DEFAULT CURRENT MONTH
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

      this.filteredLeads = this.leads.filter(l => {
        const d = new Date(l.date).getTime();
        return d >= start && d <= end;
      });

      this.setupPagination();
    });
  }

  applyFilters() {

    if (
      this.filterFromDate &&
      this.filterToDate &&
      new Date(this.filterToDate) < new Date(this.filterFromDate)
    ) {
      alert('To Date cannot be earlier than From Date');
      return;
    }

    const from = this.filterFromDate ? new Date(this.filterFromDate).setHours(0, 0, 0, 0) : null;
    const to = this.filterToDate ? new Date(this.filterToDate).setHours(23, 59, 59, 999) : null;

    this.filteredLeads = this.leads.filter(l => {
      const d = new Date(l.date).getTime();
      const dateOk = (!from || d >= from) && (!to || d <= to);
      const statusOk = this.filterStatus !== '' ? String(l.isActive) === this.filterStatus : true;
      return dateOk && statusOk;
    });

    this.setupPagination();
  }


  getToday(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]; // yyyy-MM-dd
  }



  clearFilters() {
    const today = this.getToday();
    this.filterFromDate = today;   // ✅ today
    this.filterToDate = today;
    this.filterStatus = '';
    this.filteredLeads = [...this.leads];
    this.setupPagination();
  }

  setupPagination() {
    this.totalPages = Math.ceil(this.filteredLeads.length / this.pageSize);
    this.currentPage = 1;
    this.updatePaginatedData();
  }

  updatePaginatedData() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedLeads = this.filteredLeads.slice(start, start + this.pageSize);
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

  exportData(type: string) {
    if (type === 'pdf') this.exportPDF();
    if (type === 'excel') this.exportExcel();
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.text('Lead List', 14, 15);

    autoTable(doc, {
      head: [['#', 'Customer', 'Contact', 'Email', 'Budget', 'Status']],
      body: this.filteredLeads.map((l, i) => [
        i + 1,
        l.cname,
        l.contactNo,
        l.email,
        l.budget,
        l.isActive ? 'Active' : 'Inactive'
      ]),
      startY: 20
    });

    doc.save('leads.pdf');
  }

  exportExcel() {
    const data = this.filteredLeads.map((l, i) => ({
      'Sr No': i + 1,
      'Customer': l.cname,
      'Contact': l.contactNo,
      'Email': l.email,
      'Budget': l.budget,
      'Status': l.isActive ? 'Active' : 'Inactive'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'leads.xlsx');
  }

  openCreate() {
    this.isEditMode = false;
    this.editLeadId = null;
    this.showLeads = false;
  }

  backToList() {
    this.showLeads = true;
  }

  editLead(lead: any) {
    this.isEditMode = true;
    this.editLeadId = lead.leadId;
    this.showLeads = false;
    this.form.patchValue(lead);
    this.onStateChange();
    this.onDistrictChange();
  }

  submit() {
    if (this.form.invalid) return;

    this.loading = true;
    const payload = { ...this.form.value, cname: this.form.value.cName, leadId: this.editLeadId };

    const req = this.isEditMode && this.editLeadId
      ? this.leadService.update(this.editLeadId, payload)
      : this.leadService.create(payload);

    req.subscribe(() => {
      alert(this.isEditMode ? 'Lead Updated' : 'Lead Created');
      this.loading = false;
      this.showLeads = true;
      this.loadLeads();
    });
  }
}
